// const { Op } = require("sequelize");
// const Sales = require("../model/SaleModel");
// const SaleItemsDetail = require("../model/SaleItemDetail");
// const sequelize = require("../config/db");

// // Helper: generate sale_id with timestamp to avoid duplicates
// const generateSaleId = async () => {
//   const timestamp = Date.now();
//   const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//   return `SL-${timestamp}-${random}`;
// };

// // Helper: generate std_id with timestamp to avoid duplicates
// const generateStdId = async () => {
//   const timestamp = Date.now();
//   const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//   return `STD-${timestamp}-${random}`;
// };

// // GET all sales (with pagination & search)
// const getAllSales = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       search = "",
//       startDate,
//       endDate,
//     } = req.query;

//     const offset = (parseInt(page) - 1) * parseInt(limit);

//     const whereClause = {};
//     if (search) {
//       whereClause[Op.or] = [
//         { sale_id: { [Op.like]: `%${search}%` } },
//         { invoice_id: { [Op.like]: `%${search}%` } },
//         { pay_method: { [Op.like]: `%${search}%` } },
//       ];
//     }
//     if (startDate && endDate) {
//       // Add time to endDate to include the entire day
//       const endDateTime = new Date(endDate);
//       endDateTime.setHours(23, 59, 59, 999);
//       whereClause.sale_date = { 
//         [Op.gte]: startDate,
//         [Op.lte]: endDateTime
//       };
//     }

//     const { count, rows } = await Sales.findAndCountAll({
//       where: whereClause,
//       include: [
//         {
//           model: SaleItemsDetail,
//           as: "SaleItemsDetails",
//         },
//       ],
//       order: [["sale_date", "DESC"]],
//       limit: parseInt(limit),
//       offset,
//     });

//     res.status(200).json({
//       success: true,
//       data: rows,
//       pagination: {
//         total: count,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         totalPages: Math.ceil(count / parseInt(limit)),
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // GET single sale by ID
// const getSaleById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const sale = await Sales.findByPk(id, {
//       include: [{ model: SaleItemsDetail, as: "SaleItemsDetails" }],
//     });
//     if (!sale)
//       return res.status(404).json({ success: false, message: "Sale not found" });
//     res.status(200).json({ success: true, data: sale });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // POST create sale with items (transaction)
// const createSale = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     // log incoming payload for debugging
//     console.log("[createSale] request body:", JSON.stringify(req.body));
//     const {
//       invoice_id,
//       sale_date,
//       amount,
//       sub_total,
//       tax,
//       pay_method,
//       qr_code,
//       customer_id,
//       create_by,
//       items = [],
//     } = req.body;

//     if (pay_method === 'KHQR' && !qr_code) {
//       return res.status(400).json({ success: false, message: "QR code is required for KHQR payment" });
//     }

//     const sale_id = await generateSaleId();
//     const now = new Date();

//     const newSale = await Sales.create(
//       {
//         sale_id,
//         invoice_id,
//         sale_date,
//         amount,
//         sub_total,
//         tax,
//         pay_method,
//         qr_code,
//         customer_id,
//         create_by,
//         created_on: now,
//       },
//       { transaction: t }
//     );

//     if (items.length > 0) {
//       const saleItems = await Promise.all(
//         items.map(async (item) => {
//           const std_id = await generateStdId();
//           return {
//             std_id,
//             sale_id,
//             prd_id: item.prd_id,
//             qty: item.qty,
//             price: item.price,
//             create_by,
//             created_on: now,
//           };
//         })
//       );
//       await SaleItemsDetail.bulkCreate(saleItems, { transaction: t });

//       // Update product quantities
//       const Products = require("../model/ProductModel");
//       for (const item of items) {
//         const product = await Products.findByPk(item.prd_id, { transaction: t });
//         if (product) {
//           const newQty = parseInt(product.qty || 0) - parseInt(item.qty || 0);
//           await product.update({ qty: Math.max(0, newQty) }, { transaction: t });
//         }
//       }
//     }

//     // alert to Telegram bot about new sale (non-blocking)
//     // This is a non-blocking call, so we don't await it
//     alertToTelegramBot(newSale);
//     // setting alert out stock and low stock (non-blocking)
//     checkAndAlertStockLevels();
//     await t.commit();
//     res.status(201).json({
//       success: true,
//       message: "Sale created successfully",
//       data: newSale,
//     });
//   } catch (error) {
//     await t.rollback();
//     // log full error for debugging
//     console.error("[createSale] caught error:", error);
    
//     // Handle Sequelize validation errors specifically
//     let errorMessage = error.message;
//     if (error.name === 'SequelizeValidationError') {
//       errorMessage = error.errors.map(e => e.message).join(', ');
//     } else if (error.name === 'SequelizeUniqueConstraintError') {
//       errorMessage = 'Duplicate entry: ' + error.errors.map(e => e.path).join(', ');
//     }
    
//     res.status(500).json({ success: false, message: errorMessage });
//   }
// };

// // PUT update sale
// const updateSale = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const { id } = req.params;
//     const {
//       invoice_id,
//       sale_date,
//       amount,
//       sub_total,
//       tax,
//       pay_method,
//       qr_code,
//       changed_by,
//       items,
//     } = req.body;

//     const sale = await Sales.findByPk(id);
//     if (!sale)
//       return res.status(404).json({ success: false, message: "Sale not found" });

//     await sale.update(
//       {
//         invoice_id,
//         sale_date,
//         amount,
//         sub_total,
//         tax,
//         pay_method,
//         qr_code,
//         changed_by,
//         changed_on: new Date(),
//       },
//       { transaction: t }
//     );

//     if (items && items.length > 0) {
//       await SaleItemsDetail.destroy({ where: { sale_id: id }, transaction: t });
//       const now = new Date();
//       const saleItems = await Promise.all(
//         items.map(async (item) => {
//           const std_id = await generateStdId();
//           return {
//             std_id,
//             sale_id: id,
//             prd_id: item.prd_id,
//             qty: item.qty,
//             price: item.price,
//             create_by: changed_by,
//             created_on: now,
//           };
//         })
//       );
//       await SaleItemsDetail.bulkCreate(saleItems, { transaction: t });
//     }

//     await t.commit();
//     res.status(200).json({
//       success: true,
//       message: "Sale updated successfully",
//       data: sale,
//     });
//   } catch (error) {
//     await t.rollback();
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // DELETE sale
// const deleteSale = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const { id } = req.params;
//     const sale = await Sales.findByPk(id, {
//       include: [{ model: SaleItemsDetail, as: "SaleItemsDetails" }],
//       transaction: t,
//     });
//     if (!sale)
//       return res.status(404).json({ success: false, message: "Sale not found" });

//     // Restore product quantities
//     const Products = require("../model/ProductModel");
//     if (sale.SaleItemsDetails && sale.SaleItemsDetails.length > 0) {
//       for (const item of sale.SaleItemsDetails) {
//         const product = await Products.findByPk(item.prd_id, { transaction: t });
//         if (product) {
//           const newQty = parseInt(product.qty || 0) + parseInt(item.qty || 0);
//           await product.update({ qty: newQty }, { transaction: t });
//         }
//       }
//     }

//     await SaleItemsDetail.destroy({ where: { sale_id: id }, transaction: t });
//     await sale.destroy({ transaction: t });
//     await t.commit();

//     res.status(200).json({ success: true, message: "Sale deleted successfully" });
//   } catch (error) {
//     await t.rollback();
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   getAllSales,
//   getSaleById,
//   createSale,
//   updateSale,
//   deleteSale,
// };

const { Op } = require("sequelize");
const Sales = require("../model/SaleModel");
const SaleItemsDetail = require("../model/SaleItemDetail");
const Products = require("../model/ProductModel");
const sequelize = require("../config/db");
const { alertNewSale } = require("../utils/telegramBot");
const { checkMultipleProductsStock } = require("../utils/stockAlert");

const generateSaleId = async () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `SL-${timestamp}-${random}`;
};

const generateStdId = async () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `STD-${timestamp}-${random}`;
};

const getAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;

    const currentPage = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);
    const offset = (currentPage - 1) * pageLimit;

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { sale_id: { [Op.like]: `%${search}%` } },
        { invoice_id: { [Op.like]: `%${search}%` } },
        { pay_method: { [Op.like]: `%${search}%` } },
      ];
    }

    if (startDate && endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);

      whereClause.sale_date = {
        [Op.gte]: startDate,
        [Op.lte]: endDateTime,
      };
    }

    const { count, rows } = await Sales.findAndCountAll({
      where: whereClause,
      include: [{ model: SaleItemsDetail, as: "SaleItemsDetails" }],
      order: [["sale_date", "DESC"]],
      limit: pageLimit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(count / pageLimit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sales.findByPk(id, {
      include: [{ model: SaleItemsDetail, as: "SaleItemsDetails" }],
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
      qr_code = null,
      customer_id,
      create_by,
      items = [],
    } = req.body;

    if (pay_method === "KHQR" && !qr_code) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "QR code is required for KHQR payment",
      });
    }

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
        qr_code,
        customer_id,
        create_by,
        created_on: now,
      },
      { transaction: t }
    );

    const affectedProductIds = [];

    if (items.length > 0) {
      const saleItems = [];

      for (const item of items) {
        const product = await Products.findByPk(item.prd_id, { transaction: t });

        if (!product) {
          throw new Error(`Product ID ${item.prd_id} not found`);
        }

        const currentQty = parseInt(product.qty || 0, 10);
        const saleQty = parseInt(item.qty || 0, 10);

        if (saleQty <= 0) {
          throw new Error(`Invalid qty for product ID ${item.prd_id}`);
        }

        if (currentQty < saleQty) {
          throw new Error(`Insufficient stock for product ID ${item.prd_id}`);
        }

        const std_id = await generateStdId();

        saleItems.push({
          std_id,
          sale_id,
          prd_id: item.prd_id,
          qty: saleQty,
          price: item.price,
          create_by,
          created_on: now,
        });

        await product.update(
          { qty: currentQty - saleQty },
          { transaction: t }
        );

        affectedProductIds.push(item.prd_id);
      }

      await SaleItemsDetail.bulkCreate(saleItems, { transaction: t });
    }

    await t.commit();

    alertNewSale(newSale).catch((err) =>
      console.error("Sale telegram alert error:", err.message)
    );

    // Fetch updated products for stock alerts
    const affectedProducts = await Products.findAll({
      where: { prd_id: affectedProductIds }
    });

    checkMultipleProductsStock(affectedProducts).catch((err) =>
      console.error("Stock telegram alert error:", err.message)
    );

    return res.status(201).json({
      success: true,
      message: "Sale created successfully",
      data: newSale,
    });
  } catch (error) {
    await t.rollback();

    let errorMessage = error.message;
    if (error.name === "SequelizeValidationError") {
      errorMessage = error.errors.map((e) => e.message).join(", ");
    } else if (error.name === "SequelizeUniqueConstraintError") {
      errorMessage =
        "Duplicate entry: " + error.errors.map((e) => e.path).join(", ");
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

const sendReceiptPhoto = async (req, res) => {
  try {
    const { imageData, caption } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: "Image data is required",
      });
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const { sendTelegramPhoto } = require("../utils/telegramBot");
    await sendTelegramPhoto(imageBuffer, caption || '');

    return res.status(200).json({
      success: true,
      message: "Receipt photo sent to Telegram successfully",
    });
  } catch (error) {
    console.error("Send receipt photo error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send receipt photo",
    });
  }
};

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
      qr_code,
      changed_by,
      items = [],
    } = req.body;

    const sale = await Sales.findByPk(id, {
      include: [{ model: SaleItemsDetail, as: "SaleItemsDetails" }],
      transaction: t,
    });

    if (!sale) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    if (sale.SaleItemsDetails?.length) {
      for (const oldItem of sale.SaleItemsDetails) {
        const product = await Products.findByPk(oldItem.prd_id, { transaction: t });
        if (product) {
          await product.update(
            { qty: parseInt(product.qty || 0, 10) + parseInt(oldItem.qty || 0, 10) },
            { transaction: t }
          );
        }
      }
    }

    await sale.update(
      {
        invoice_id,
        sale_date,
        amount,
        sub_total,
        tax,
        pay_method,
        qr_code,
        changed_by,
        changed_on: new Date(),
      },
      { transaction: t }
    );

    await SaleItemsDetail.destroy({
      where: { sale_id: id },
      transaction: t,
    });

    if (items.length > 0) {
      const saleItems = [];
      const now = new Date();

      for (const item of items) {
        const product = await Products.findByPk(item.prd_id, { transaction: t });

        if (!product) {
          throw new Error(`Product ID ${item.prd_id} not found`);
        }

        const currentQty = parseInt(product.qty || 0, 10);
        const saleQty = parseInt(item.qty || 0, 10);

        if (currentQty < saleQty) {
          throw new Error(`Insufficient stock for product ID ${item.prd_id}`);
        }

        const std_id = await generateStdId();

        saleItems.push({
          std_id,
          sale_id: id,
          prd_id: item.prd_id,
          qty: saleQty,
          price: item.price,
          create_by: changed_by,
          created_on: now,
        });

        await product.update(
          { qty: currentQty - saleQty },
          { transaction: t }
        );
      }

      await SaleItemsDetail.bulkCreate(saleItems, { transaction: t });
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: sale,
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteSale = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    const sale = await Sales.findByPk(id, {
      include: [{ model: SaleItemsDetail, as: "SaleItemsDetails" }],
      transaction: t,
    });

    if (!sale) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    if (sale.SaleItemsDetails?.length) {
      for (const item of sale.SaleItemsDetails) {
        const product = await Products.findByPk(item.prd_id, { transaction: t });
        if (product) {
          await product.update(
            { qty: parseInt(product.qty || 0, 10) + parseInt(item.qty || 0, 10) },
            { transaction: t }
          );
        }
      }
    }

    await SaleItemsDetail.destroy({
      where: { sale_id: id },
      transaction: t,
    });

    await sale.destroy({ transaction: t });
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Sale deleted successfully",
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  sendReceiptPhoto,
};