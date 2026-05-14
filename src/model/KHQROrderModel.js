const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const KHQROrder = sequelize.define(
  "KHQROrder",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: "",
      field: "userId",
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "USD",
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "khqr",
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qr_md5: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    qr_expiration: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING(25),
      allowNull: false,
      defaultValue: "pending",
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fromAccountId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    toAccountId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tbl_khqr_order",
    timestamps: false,
  },
);

module.exports = KHQROrder;
