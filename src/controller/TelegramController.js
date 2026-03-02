const Telegram = require("../model/TelegramModel");
const logError = require("../util/service");

// GET all telegram configs
const getAllTelegrams = async (req, res) => {
  try {
    const telegrams = await Telegram.findAll();
    res.status(200).json({
      success: true,
      message: "Telegram configurations retrieved successfully",
      data: telegrams,
    });
  } catch (error) {
    logError("TelegramController", error, res);
  }
};

// GET telegram by ID
const getTelegramById = async (req, res) => {
  try {
    const { id } = req.params;
    const telegram = await Telegram.findByPk(id);
    
    if (!telegram) {
      return res.status(404).json({
        success: false,
        message: "Telegram configuration not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: telegram,
    });
  } catch (error) {
    logError("TelegramController", error, res);
  }
};

// POST create telegram config
const createTelegram = async (req, res) => {
  try {
    const { tel_id, token, group, status, is_alert } = req.body;
    
    const telegram = await Telegram.create({
      tel_id,
      token,
      group,
      status,
      is_alert,
    });
    
    res.status(201).json({
      success: true,
      message: "Telegram configuration created successfully",
      data: telegram,
    });
  } catch (error) {
    logError("TelegramController", error, res);
  }
};

// PUT update telegram config
const updateTelegram = async (req, res) => {
  try {
    const { id } = req.params;
    const { token, group, status, is_alert } = req.body;
    
    const telegram = await Telegram.findByPk(id);
    
    if (!telegram) {
      return res.status(404).json({
        success: false,
        message: "Telegram configuration not found",
      });
    }
    
    await telegram.update({
      token,
      group,
      status,
      is_alert,
    });
    
    res.status(200).json({
      success: true,
      message: "Telegram configuration updated successfully",
      data: telegram,
    });
  } catch (error) {
    logError("TelegramController", error, res);
  }
};

// DELETE telegram config
const deleteTelegram = async (req, res) => {
  try {
    const { id } = req.params;
    const telegram = await Telegram.findByPk(id);
    
    if (!telegram) {
      return res.status(404).json({
        success: false,
        message: "Telegram configuration not found",
      });
    }
    
    await telegram.destroy();
    
    res.status(200).json({
      success: true,
      message: "Telegram configuration deleted successfully",
    });
  } catch (error) {
    logError("TelegramController", error, res);
  }
};

module.exports = {
  getAllTelegrams,
  getTelegramById,
  createTelegram,
  updateTelegram,
  deleteTelegram,
};
