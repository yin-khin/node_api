// sale_id
// VARCHAR
// invoice_id
// VARCHAR
// sale_date
// DATE
// amount
// DOUBLE
// sub_total
// DOUBLE
// tax
// DECIMAL
// pay_method
// VARCHAR
// create_by
// VARCHAR
// created_on
// DATE
// changed_by
// VARCHAR
// changed_on
// DATE
// Comment

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const PaymentMethods = require("./PaymentMethodModel");
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
Sales.belongsTo(PaymentMethods, {
  foreignKey: "pay_method",
  targetKey: "code",
  onDelete: "CASCADE",
});

// Add hasMany relationship for SaleItemsDetail
Sales.hasMany(require("./SaleItemDetail"), {
  foreignKey: "sale_id",
  sourceKey: "sale_id",
  as: "SaleItemsDetails",
});

module.exports = Sales;
