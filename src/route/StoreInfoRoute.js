const {
  getStoreInfo,
  createStoreInfo,
  updateStoreInfo,
} = require("../controller/StoreInfoController");

const StoreInfoRoutes = (app) => {
  app.get("/api/store-info", getStoreInfo);
  app.post("/api/store-info", createStoreInfo);
  app.put("/api/store-info/:id", updateStoreInfo);
};

module.exports = StoreInfoRoutes;
