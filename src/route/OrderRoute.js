const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  cancelOrder,
} = require("../controller/OrderController");

const Orders = (app) => {
  app.get("/api/orders", getAllOrders);
  app.get("/api/orders/:id", getOrderById);
  app.post("/api/orders", createOrder);
  app.put("/api/orders/:id", updateOrder);
  app.put("/api/orders/:id/cancel", cancelOrder);
  app.delete("/api/orders/:id", deleteOrder);
};

module.exports = Orders;
