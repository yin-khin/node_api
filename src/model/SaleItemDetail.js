const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SaleItemsDetail = sequelize.define("SaleItemsDetail", {
  std_id: {
    type: DataTypes.STRING(25),
    primaryKey: true,
  },
  sale_id: {
    type: DataTypes.STRING(25),
    allowNull: false,
  },
  prd_id: {
    type: DataTypes.STRING(25),
    allowNull: false,
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0, 
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), 
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
}, {
  tableName: "tbl_sale_item_detail",
  timestamps: false,
});

module.exports = SaleItemsDetail;