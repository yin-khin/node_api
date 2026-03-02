const {
  getAllPaymentMethods,
  getPaymentMethodByCode,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require("../controller/PaymentMethodController");

const PaymentMethods = (app) => {
  app.get("/api/payment-methods", getAllPaymentMethods);
  app.get("/api/payment-methods/:code", getPaymentMethodByCode);
  app.post("/api/payment-methods", createPaymentMethod);
  app.put("/api/payment-methods/:code", updatePaymentMethod);
  app.delete("/api/payment-methods/:code", deletePaymentMethod);
};

module.exports = PaymentMethods;
