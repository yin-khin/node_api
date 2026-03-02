const StoreInfo = require("../model/StoreInfoModel");
const logError = require("../util/service");

// GET store info (usually only one record)
const getStoreInfo = async (req, res) => {
  try {
    const storeInfo = await StoreInfo.findOne();
    
    if (!storeInfo) {
      return res.status(404).json({
        success: false,
        message: "Store information not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: storeInfo,
    });
  } catch (error) {
    logError("StoreInfoController", error, res);
  }
};

// POST create store info
const createStoreInfo = async (req, res) => {
  try {
    const { store_name, email, website, logo } = req.body;
    
    // Check if store info already exists
    const existing = await StoreInfo.findOne();
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Store information already exists. Use update instead.",
      });
    }
    
    const storeInfo = await StoreInfo.create({
      store_name,
      email,
      website,
      logo,
    });
    
    res.status(201).json({
      success: true,
      message: "Store information created successfully",
      data: storeInfo,
    });
  } catch (error) {
    logError("StoreInfoController", error, res);
  }
};

// PUT update store info
const updateStoreInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { store_name, email, website, logo } = req.body;
    
    const storeInfo = await StoreInfo.findByPk(id);
    
    if (!storeInfo) {
      return res.status(404).json({
        success: false,
        message: "Store information not found",
      });
    }
    
    await storeInfo.update({
      store_name,
      email,
      website,
      logo,
    });
    
    res.status(200).json({
      success: true,
      message: "Store information updated successfully",
      data: storeInfo,
    });
  } catch (error) {
    logError("StoreInfoController", error, res);
  }
};

module.exports = {
  getStoreInfo,
  createStoreInfo,
  updateStoreInfo,
};
