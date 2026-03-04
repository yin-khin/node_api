const { Op } = require("sequelize");
const Sales = require("../model/SaleModel");
const SaleItemsDetail = require("../model/SaleItemDetail");
const sequelize = require("../config/db");

// Helper: generate sale_id
const generateSaleId = async () => {
  const last = await Sales.findOne({ order: [["sale_id", "DESC"]] });
  if (!last) return "SL-00001";
  const num = parseInt(last.sale_id.split("-")[1]) + 1;
  return `SL-${String(num).padStart(5, "0")}`;
};

// Helper: generate std_id
const generateStdId = async () => {
  const last = await SaleItemsDetail.findOne({ order: [["std_id", "DESC"]] });
  if (!last) return "STD-00001";
  const num = parseInt(last.std_id.split("-")[1]) + 1;
  return `STD-${String(num).padStart(5, "0")}`;
};

// GET all sales (with pagination & search)
const getAllSales = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      startDate,
      endDate,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { sale_id: { [Op.like]: `%${search}%` } },
        { invoice_id: { [Op.like]: `%${search}%` } },
        { pay_method: { [Op.like]: `%${search}%` } },
      ];
    }
    if (startDate && endDate) {
      // Add time to endDate to include the entire day
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      whereClause.sale_date = { 
        [Op.gte]: startDate,
        [Op.lte]: endDateTime
      };
    }

    const { count, rows } = await Sales.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: SaleItemsDetail,
          as: "SaleItemsDetails",
        },
      ],
      order: [["sale_date", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET single sale by ID
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sales.findByPk(id, {
      include: [{ model: SaleItemsDetail, as: "SaleItemsDetails" }],
    });
    if (!sale)
      return res.status(404).json({ success: false, message: "Sale not found" });
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create sale with items (transaction)
const createSale = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      invoice_id,
      sale_date,
      amount,
      sub_total,
      tax,
      pay_method,
      create_by,
      items = [],
    } = req.body;

    const sale_id = await generateSaleId();
    const now = new Date();

    const newSale = await Sales.create(
      {
        sale_id,
        invoice_id,
        sale_date,
        amount,
        sub_total,
        tax,
        pay_method,
        create_by,
        created_on: now,
      },
      { transaction: t }
    );

    if (items.length > 0) {
      const saleItems = await Promise.all(
        items.map(async (item) => {
          const std_id = await generateStdId();
          return {
            std_id,
            sale_id,
            prd_id: item.prd_id,
            qty: item.qty,
            price: item.price,
            create_by,
            created_on: now,
          };
        })
      );
      await SaleItemsDetail.bulkCreate(saleItems, { transaction: t });

      // Update product quantities
      const Products = require("../model/ProductModel");
      for (const item of items) {
        const product = await Products.findByPk(item.prd_id, { transaction: t });
        if (product) {
          const newQty = parseInt(product.qty || 0) - parseInt(item.qty || 0);
          await product.update({ qty: Math.max(0, newQty) }, { transaction: t });
        }
      }
    }

    await t.commit();
    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      data: newSale,
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update sale
const updateSale = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      invoice_id,
      sale_date,
      amount,
      sub_total,
      tax,
      pay_method,
      changed_by,
      items,
    } = req.body;

    const sale = await Sales.findByPk(id);
    if (!sale)
      return res.status(404).json({ success: false, message: "Sale not found" });

    await sale.update(
      {
        invoice_id,
        sale_date,
        amount,
        sub_total,
        tax,
        pay_method,
        changed_by,
        changed_on: new Date(),
      },
      { transaction: t }
    );

    if (items && items.length > 0) {
      await SaleItemsDetail.destroy({ where: { sale_id: id }, transaction: t });
      const now = new Date();
      const saleItems = await Promise.all(
        items.map(async (item) => {
          const std_id = await generateStdId();
          return {
            std_id,
            sale_id: id,
            prd_id: item.prd_id,
            qty: item.qty,
            price: item.price,
            create_by: changed_by,
            created_on: now,
          };
        })
      );
      await SaleItemsDetail.bulkCreate(saleItems, { transaction: t });
    }

    await t.commit();
    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: sale,
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE sale
const deleteSale = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const sale = await Sales.findByPk(id, {
      include: [{ model: SaleItemsDetail, as: "SaleItemsDetails" }],
      transaction: t,
    });
    if (!sale)
      return res.status(404).json({ success: false, message: "Sale not found" });

    // Restore product quantities
    const Products = require("../model/ProductModel");
    if (sale.SaleItemsDetails && sale.SaleItemsDetails.length > 0) {
      for (const item of sale.SaleItemsDetails) {
        const product = await Products.findByPk(item.prd_id, { transaction: t });
        if (product) {
          const newQty = parseInt(product.qty || 0) + parseInt(item.qty || 0);
          await product.update({ qty: newQty }, { transaction: t });
        }
      }
    }

    await SaleItemsDetail.destroy({ where: { sale_id: id }, transaction: t });
    await sale.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({ success: true, message: "Sale deleted successfully" });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};