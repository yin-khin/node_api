const { Op } = require("sequelize");
const PaymentMethods = require("../model/PaymentMethodModel");

// GET all payment methods
const getAllPaymentMethods = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { type: { [Op.like]: `%${search}%` } },
      ];
    }

    const paymentMethods = await PaymentMethods.findAll({
      where: whereClause,
      order: [["code", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: paymentMethods.map((pm) => ({
        ...pm.toJSON(),
        status: pm.is_active === 1 ? "Active" : "Inactive",
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET payment method by code
const getPaymentMethodByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const paymentMethod = await PaymentMethods.findByPk(code);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...paymentMethod.toJSON(),
        status: paymentMethod.is_active === 1 ? "Active" : "Inactive",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create payment method
const createPaymentMethod = async (req, res) => {
  try {
    const { code, type, fee, status } = req.body;

    // Validate required fields
    if (!code || !type) {
      return res.status(400).json({
        success: false,
        message: "Code and type are required",
      });
    }

    // Check if payment method already exists
    const existing = await PaymentMethods.findByPk(code);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Payment method with this code already exists",
      });
    }

    const newPaymentMethod = await PaymentMethods.create({
      code,
      type,
      fee: fee || 0,
      is_active: status === "Active" ? 1 : 0,
    });

    res.status(201).json({
      success: true,
      message: "Payment method created successfully",
      data: {
        ...newPaymentMethod.toJSON(),
        status: newPaymentMethod.is_active === 1 ? "Active" : "Inactive",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update payment method
const updatePaymentMethod = async (req, res) => {
  try {
    const { code } = req.params;
    const { type, fee, status } = req.body;

    const paymentMethod = await PaymentMethods.findByPk(code);
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    await paymentMethod.update({
      type: type || paymentMethod.type,
      fee: fee !== undefined ? fee : paymentMethod.fee,
      is_active: status === "Active" ? 1 : status === "Inactive" ? 0 : paymentMethod.is_active,
    });

    res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      data: {
        ...paymentMethod.toJSON(),
        status: paymentMethod.is_active === 1 ? "Active" : "Inactive",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE payment method
const deletePaymentMethod = async (req, res) => {
  try {
    const { code } = req.params;

    const paymentMethod = await PaymentMethods.findByPk(code);
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    await paymentMethod.destroy();

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPaymentMethods,
  getPaymentMethodByCode,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
