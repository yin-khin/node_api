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

// Importing routes to be used in server.js /index.js
//===========================================================

//============================================================
// Load models to establish associations migration to database

require("./src/model/ProductModel");
require("./src/model/CategoryModel");
require("./src/model/BrandModel");
require("./src/model/TelegramModel");
require("./src/model/CustomerModel");
require("./src/model/SettingModel");
require("./src/model/UserModel");
require("./src/model/StoreInfoModel");
require("./src/model/GeneralSettingModel");
require("./src/model/PaymentMethodModel");
require("./src/model/SaleModel");
require("./src/model/SaleItemDetail");
require("./src/model/OrderModel");
require("./src/model/OrderItem");
// require("./src/model/");

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

//Route to Controller
//====================================
sequelize
  .sync()
  .then(() => {
    console.log("Database synced successfully");
    app.listen(3000, function () {
      console.log("localhost:3000");
    });
  })
  .catch((err) => {
    console.error("DB sync error:", err);
  });
