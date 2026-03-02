const {
  getAllSettings,
  getSettingByCode,
  createSetting,
  updateSetting,
  deleteSetting,
} = require("../controller/SettingController");

const Settings = (app) => {
  app.get("/api/settings", getAllSettings);
  app.get("/api/settings/:code", getSettingByCode);
  app.post("/api/settings", createSetting);
  app.put("/api/settings/:code", updateSetting);
  app.delete("/api/settings/:code", deleteSetting);
};

module.exports = Settings;
