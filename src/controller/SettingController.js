const Setting = require("../model/SettingModel");
const logError = require("../util/service");

// GET all settings
const getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll();
    res.status(200).json({
      success: true,
      message: "Settings retrieved successfully",
      data: settings,
    });
  } catch (error) {
    logError("SettingController", error, res);
  }
};

// GET setting by code
const getSettingByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const setting = await Setting.findByPk(code);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    logError("SettingController", error, res);
  }
};

// POST create setting
const createSetting = async (req, res) => {
  try {
    const { setting_code, setting_type, dec, status } = req.body;
    
    const setting = await Setting.create({
      setting_code,
      setting_type,
      dec,
      status,
    });
    
    res.status(201).json({
      success: true,
      message: "Setting created successfully",
      data: setting,
    });
  } catch (error) {
    logError("SettingController", error, res);
  }
};

// PUT update setting
const updateSetting = async (req, res) => {
  try {
    const { code } = req.params;
    const { setting_type, dec, status } = req.body;
    
    const setting = await Setting.findByPk(code);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }
    
    await setting.update({
      setting_type,
      dec,
      status,
    });
    
    res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      data: setting,
    });
  } catch (error) {
    logError("SettingController", error, res);
  }
};

// DELETE setting
const deleteSetting = async (req, res) => {
  try {
    const { code } = req.params;
    const setting = await Setting.findByPk(code);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }
    
    await setting.destroy();
    
    res.status(200).json({
      success: true,
      message: "Setting deleted successfully",
    });
  } catch (error) {
    logError("SettingController", error, res);
  }
};

module.exports = {
  getAllSettings,
  getSettingByCode,
  createSetting,
  updateSetting,
  deleteSetting,
};
