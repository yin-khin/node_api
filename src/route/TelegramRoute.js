const {
  getAllTelegrams,
  getTelegramById,
  createTelegram,
  updateTelegram,
  deleteTelegram,
} = require("../controller/TelegramController");

const Telegrams = (app) => {
  app.get("/api/telegrams", getAllTelegrams);
  app.get("/api/telegrams/:id", getTelegramById);
  app.post("/api/telegrams", createTelegram);
  app.put("/api/telegrams/:id", updateTelegram);
  app.delete("/api/telegrams/:id", deleteTelegram);
};

module.exports = Telegrams;
