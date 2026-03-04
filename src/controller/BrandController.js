const Brand = require("../model/BrandModel");
const Categories = require("../model/CategoryModel");

// const db = require("../config/db");
const getAllBrand = async (req, res) => {
  try {
    const brand = await Brand.findAll({
      include: [
        {
          model: Categories,
          as: "category",
          required: false,
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "success get brands",
      brand,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "not fount brands",
      error: e.message,
    });
  }
};

const createBrand = async (req, res) => {
  try {
    const brand = await Brand.create(req.body, {
      include: [
        {
          model: Categories,
          as: "category",
          required: false,
        },
      ],
    });
    return res.status(201).json({
      success: true,
      message: "Create brands success",
      brand,
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Error creating brand", 
      error 
    });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { desc, category_id, remark, photo } = req.body;
    const brand = await Brand.findByPk(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    await brand.update({ desc, category_id, remark, photo });

    res.status(200).json({
      success: true,
      message: "Updated success",
      brand,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error updating brand",
      error: e.message,
    });
  }
};
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }
    
    await brand.destroy();
    res.status(200).json({
      success: true,
      message: "Deleted successfully",
      brand,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error deleting brand",
      error: e.message,
    });
  }
};
module.exports = {
  getAllBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
