const Brands = require("../model/BrandModel");
const Categories = require("../model/CategoryModel");
const Products = require("../model/ProductModel");

const createProduct = async (req, res) => {
  try {
    const product = await Products.create(req.body);

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Failed to create product",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Products.findAll({
      include: [
        { model: Categories, as: "category" },
        { model: Brands, as: "brand" },
      ],
    });
    return res.status(200).json({
      success: true,
      message: "success get products",
      products,
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Error retrieving products", 
      error 
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id, {
      include: [
        {
          model: Categories,
          as: "category",
        },
        {
          model: Brands,
          as: "brand",
        },
      ],
    });
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }
    return res.status(200).json({
      success: true,
      message: "success get product",
      product,
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: "Error retrieving product", 
      error 
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      prd_name,
      category_id,
      brand_id,
      stock_date,
      exp_date,
      qty,
      unit_cost,
      telegram,
      status,
      remark,
      photo,
    } = req.body;
    const product = await Products.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    
    await product.update({
      prd_name,
      category_id,
      brand_id,
      stock_date,
      exp_date,
      qty,
      unit_cost,
      telegram,
      status,
      remark,
      photo,
    });
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error updating product", 
      error 
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Products.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    
    await product.destroy();
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error deleting product", 
      error 
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
