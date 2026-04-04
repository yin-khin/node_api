//server.js

require("dotenv").config();
var express = require("express");
const sequelize = require("./src/config/db");

//===========================================================
// Importing routes to be used in server.js /index.js

var ProductRoute = require("./src/route/ProductRoute");
var CategoryRoute = require("./src/route/CategoryRoute");
var BrandRoute = require("./src/route/BrandRoute");
var CustomerRoute = require("./src/route/CustomerRoute");
var UserRoute = require("./src/route/UserRoute");
var SaleRoute = require("./src/route/Saleroute");
var OrderRoute = require("./src/route/OrderRoute");
var PaymentMethodRoute = require("./src/route/PaymentMethodRoute");
var SettingRoute = require("./src/route/SettingRoute");
var StoreInfoRoute = require("./src/route/StoreInfoRoute");
var GeneralSettingRoute = require("./src/route/GeneralSettingRoute");
var TelegramRoute = require("./src/route/TelegramRoute");
var KHQRRoute = require("./src/route/KHQRRoute");

// Importing routes to be used in server.js /index.js
//===========================================================

//============================================================
// Load models to establish associations migration to database

const Products = require("./src/model/ProductModel");
const Categories = require("./src/model/CategoryModel");
const Brands = require("./src/model/BrandModel");
const Telegrams = require("./src/model/TelegramModel");
const Customers = require("./src/model/CustomerModel");
const Settings = require("./src/model/SettingModel");
const Users = require("./src/model/UserModel");
const StoreInfo = require("./src/model/StoreInfoModel");
const GeneralSettings = require("./src/model/GeneralSettingModel");
const PaymentMethods = require("./src/model/PaymentMethodModel");
const Sales = require("./src/model/SaleModel");
const SaleItemsDetail = require("./src/model/SaleItemDetail");
const Orders = require("./src/model/OrderModel");
const OrderItems = require("./src/model/OrderItem");

// Define associations after all models are loaded
// Note: Products and Brands already have associations defined in their model files

// Sales associations
// Sales.belongsTo(PaymentMethods, {
//   foreignKey: "pay_method",
//   targetKey: "code",
//   onDelete: "CASCADE",
// });

Sales.hasMany(SaleItemsDetail, {
  foreignKey: "sale_id",
  sourceKey: "sale_id",
  as: "SaleItemsDetails",
});

// SaleItemsDetail associations
SaleItemsDetail.belongsTo(Sales, {
  foreignKey: "sale_id",
  targetKey: "sale_id",
  onDelete: "CASCADE",
});

SaleItemsDetail.belongsTo(Products, {
  foreignKey: "prd_id",
  targetKey: "prd_id",
  onDelete: "CASCADE",
});

// Orders associations
Orders.belongsTo(Customers, {
  foreignKey: "customer_id",
  targetKey: "customer_id",
  onDelete: "CASCADE",
});

Orders.hasMany(OrderItems, {
  foreignKey: "order_id",
  sourceKey: "order_id",
  as: "OrderItems",
});

OrderItems.belongsTo(Orders, {
  foreignKey: "order_id",
  targetKey: "order_id",
  onDelete: "CASCADE",
});

OrderItems.belongsTo(Products, {
  foreignKey: "prd_id",
  targetKey: "prd_id",
  onDelete: "CASCADE",
});

// Load models to establish associations migration to database
//============================================================
//--------------------------------------
const cors = require("cors");
//--------------------------------------

var app = express();
app.use(cors());

// Increase body size limits to allow product photo (base64) uploads
app.use(
  express.json({
    limit: "10mb",
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

//====================================
//Route to Controller
UserRoute(app);
ProductRoute(app);
CategoryRoute(app);
BrandRoute(app);
CustomerRoute(app);
SaleRoute(app);
OrderRoute(app);
PaymentMethodRoute(app);
SettingRoute(app);
StoreInfoRoute(app);
GeneralSettingRoute(app);
TelegramRoute(app);
KHQRRoute(app);

//Route to Controller
//====================================
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synced successfully");
    app.listen(3000, function () {
      console.log("localhost:3000");
    });
  })
  .catch((err) => {
    console.error("DB sync error:", err);
  });
