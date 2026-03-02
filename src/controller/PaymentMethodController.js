const PaymentMethod = require("../model/PaymentMethodModel");
const logError = require("../util/service");

// GET all payment methods
const getAllPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.findAll();
    res.status(200).json({
      success: true,
      message: "Payment methods retrieved successfully",
      data: paymentMethods,
    });
  } catch (error) {
    logError("PaymentMethodController", error, res);
  }
};

// GET payment method by code
const getPaymentMethodByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const paymentMethod = await PaymentMethod.findByPk(code);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error) {
    logError("PaymentMethodController", error, res);
  }
};

// POST create payment method
const createPaymentMethod = async (req, res) => {
  try {
    const { code, type, is_active, fee } = req.body;
    
    const paymentMethod = await PaymentMethod.create({
      code,
      type,
      is_active,
      fee,
    });
    
    res.status(201).json({
      success: true,
      message: "Payment method created successfully",
      data: paymentMethod,
    });
  } catch (error) {
    logError("PaymentMethodController", error, res);
  }
};

// PUT update payment method
const updatePaymentMethod = async (req, res) => {
  try {
    const { code } = req.params;
    const { type, is_active, fee } = req.body;
    
    const paymentMethod = await PaymentMethod.findByPk(code);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }
    
    await paymentMethod.update({
      type,
      is_active,
      fee,
    });
    
    res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      data: paymentMethod,
    });
  } catch (error) {
    logError("PaymentMethodController", error, res);
  }
};

// DELETE payment method
const deletePaymentMethod = async (req, res) => {
  try {
    const { code } = req.params;
    const paymentMethod = await PaymentMethod.findByPk(code);
    
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
    logError("PaymentMethodController", error, res);
  }
};

module.exports = {
  getAllPaymentMethods,
  getPaymentMethodByCode,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
