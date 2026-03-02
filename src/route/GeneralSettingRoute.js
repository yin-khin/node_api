const {
  getGeneralSettings,
  createGeneralSettings,
  updateGeneralSettings,
} = require("../controller/GeneralSettingController");

const GeneralSettingsRoutes = (app) => {
  app.get("/api/general-settings", getGeneralSettings);
  app.post("/api/general-settings", createGeneralSettings);
  app.put("/api/general-settings/:id", updateGeneralSettings);
};

module.exports = GeneralSettingsRoutes;
