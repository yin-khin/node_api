// const Customers = require("../model/CustomerModel");
// const logError = require("../util/service");

// const get =async (req ,res)=>{
//     try {
//         const customers = await Customers.findAll();
//         res.status(200).json({
//             message: "success get customer",
//             customers,
//         });
//     } catch (err) {
//         res.status(500).json({
//             message: "not fount customer",
//             error: e.message,
//         });
//         logError("CustomerController", err, res);
//     }
// }

// //Create customer
// const createCustomer = async (req, res) => {
//     try {
//         const customer = await Customers.create(req.body);
//         res.status(200).json({
//             message: "create customer succuss",
//             customer,
//         });
//     } catch (e) {
//         res.status(500).json({
//             message: "is not create customer",
//             error: e.message,
//         });
//         logError("CustomerController", e, res);
//     }
// }
// module.exports = {
//     get,
//     createCustomer,
// }

const Customers = require("../model/CustomerModel");
const logError = require("../util/service");

// Get all customers
const get = async (req, res) => {
  try {
    const customers = await Customers.findAll();
    res.status(200).json({
      success: true,
      message: "success get customer",
      customers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "not found customer",
      error: err.message,
    });
    logError("CustomerController", err, res);
  }
};

// Create customer
const createCustomer = async (req, res) => {
  try {
    const customer = await Customers.create(req.body);
    res.status(200).json({
      success: true,
      message: "create customer success",
      customer,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "is not create customer",
      error: e.message,
    });
    logError("CustomerController", e, res);
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customers.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // If password is empty, don't update it
    const updateData = { ...req.body };
    if (!updateData.password || updateData.password.trim() === "") {
      delete updateData.password;
    }

    await customer.update(updateData);

    res.status(200).json({
      success: true,
      message: "update customer success",
      customer,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "failed to update customer",
      error: e.message,
    });
    logError("CustomerController", e, res);
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customers.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await customer.destroy();

    res.status(200).json({
      success: true,
      message: "delete customer success",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "failed to delete customer",
      error: e.message,
    });
    logError("CustomerController", e, res);
  }
};

// Login customer
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const customer = await Customers.findOne({ where: { email } });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Simple password check (in production, use bcrypt)
    if (customer.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Don't send password back
    const customerData = {
      customer_id: customer.customer_id,
      fullname: customer.fullname,
      email: customer.email,
      phone: customer.phone,
      photo: customer.photo,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      customer: customerData,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: e.message,
    });
    logError("CustomerController", e, res);
  }
};

module.exports = {
  get,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  loginCustomer,
};
