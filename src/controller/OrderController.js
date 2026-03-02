const { Op } = require("sequelize");
const Order = require("../model/OrderModel");
const OrderItem = require("../model/OrderItem");
const sequelize = require("../config/db");
const logError = require("../util/service");

// Helper: generate order_id
const generateOrderId = async () => {
  const last = await Order.findOne({ order: [["order_id", "DESC"]] });
  if (!last) return "ORD-00001";
  const num = parseInt(last.order_id.split("-")[1]) + 1;
  return `ORD-${String(num).padStart(5, "0")}`;
};

// GET all orders (with pagination & search)
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { order_id: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { fullname: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) {
      whereClause.status_payment = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: "OrderItems",
        },
      ],
      order: [["created_on", "DESC"]],
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
    logError("OrderController", error, res);
  }
};

// GET single order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: "OrderItems" }],
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: order 
    });
  } catch (error) {
    logError("OrderController", error, res);
  }
};

// POST create order with items (transaction)
const createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      email,
      fullname,
      address,
      postalcode,
      customer_id,
      amount,
      status_payment,
      created_by,
      items = [],
    } = req.body;

    const order_id = await generateOrderId();
    const now = new Date();

    const newOrder = await Order.create(
      {
        order_id,
        email,
        fullname,
        address,
        postalcode,
        customer_id,
        amount,
        status_payment,
        created_by,
        created_on: now,
      },
      { transaction: t }
    );

    if (items.length > 0) {
      const orderItems = items.map((item) => ({
        order_id,
        prd_id: item.prd_id,
        unit_price: item.unit_price,
        qty: item.qty,
      }));
      await OrderItem.bulkCreate(orderItems, { transaction: t });
    }

    await t.commit();
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    await t.rollback();
    logError("OrderController", error, res);
  }
};

// PUT update order
const updateOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      email,
      fullname,
      address,
      postalcode,
      amount,
      status_payment,
      changed_by,
      items,
    } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    await order.update(
      {
        email,
        fullname,
        address,
        postalcode,
        amount,
        status_payment,
        changed_by,
        changed_on: new Date(),
      },
      { transaction: t }
    );

    if (items && items.length > 0) {
      await OrderItem.destroy({ where: { order_id: id }, transaction: t });
      const orderItems = items.map((item) => ({
        order_id: id,
        prd_id: item.prd_id,
        unit_price: item.unit_price,
        qty: item.qty,
      }));
      await OrderItem.bulkCreate(orderItems, { transaction: t });
    }

    await t.commit();
    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    await t.rollback();
    logError("OrderController", error, res);
  }
};

// DELETE order
const deleteOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    await OrderItem.destroy({ where: { order_id: id }, transaction: t });
    await order.destroy({ transaction: t });
    await t.commit();

    res.status(200).json({ 
      success: true, 
      message: "Order deleted successfully" 
    });
  } catch (error) {
    await t.rollback();
    logError("OrderController", error, res);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
