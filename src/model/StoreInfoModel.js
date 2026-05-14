const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const StoreInfo = sequelize.define(
  "StoreInfo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    store_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    logo: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
  },
  {
    tableName: "tbl_store_info",
    timestamps: false,
    underscored: true,
    createdAt: false,
    updatedAt: false,
  },
);
module.exports = StoreInfo;
