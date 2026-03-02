const GeneralSetting = require("../model/GeneralSettingModel");
const logError = require("../util/service");

// GET general settings (usually only one record)
const getGeneralSettings = async (req, res) => {
  try {
    const settings = await GeneralSetting.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "General settings not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logError("GeneralSettingController", error, res);
  }
};

// POST create general settings
const createGeneralSettings = async (req, res) => {
  try {
    const { stock_alert, qty_alert, remark, is_alert } = req.body;
    
    // Check if settings already exist
    const existing = await GeneralSetting.findOne();
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "General settings already exist. Use update instead.",
      });
    }
    
    const settings = await GeneralSetting.create({
      stock_alert,
      qty_alert,
      remark,
      is_alert,
    });
    
    res.status(201).json({
      success: true,
      message: "General settings created successfully",
      data: settings,
    });
  } catch (error) {
    logError("GeneralSettingController", error, res);
  }
};

// PUT update general settings
const updateGeneralSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_alert, qty_alert, remark, is_alert } = req.body;
    
    const settings = await GeneralSetting.findByPk(id);
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "General settings not found",
      });
    }
    
    await settings.update({
      stock_alert,
      qty_alert,
      remark,
      is_alert,
    });
    
    res.status(200).json({
      success: true,
      message: "General settings updated successfully",
      data: settings,
    });
  } catch (error) {
    logError("GeneralSettingController", error, res);
  }
};

module.exports = {
  getGeneralSettings,
  createGeneralSettings,
  updateGeneralSettings,
};
