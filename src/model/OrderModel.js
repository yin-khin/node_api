const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define("Order", {
  order_id: {
    type: DataTypes.STRING(25),
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  fullname: {
    type: DataTypes.STRING(100), 
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  postalcode: {
    type: DataTypes.INTEGER, 
    allowNull: false,
  },
  customer_id: {
    type: DataTypes.STRING(25), 
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false,
  },
  status_payment: {
    type: DataTypes.ENUM,  
    values: ['pending', 'completed', 'failed', 'refunded'], 
    allowNull: false,
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  created_on: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, 
  },
  changed_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  changed_on: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "tbl_order",
  timestamps: false,
});

module.exports = Order;