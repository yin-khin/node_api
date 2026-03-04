const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Sales = sequelize.define(
  "Sales",
  {
    sale_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    sale_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    sub_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    pay_method: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    create_by: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    changed_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    changed_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tbl_sales",
    timestamps: false,
  },
);

module.exports = Sales;
