const {
  generateKHQR,
  verifyPayment,
  confirmPayment,
  checkPayment,
  markPaymentAsPaid,
  resetPaymentAsUnpaid,
  manualConfirmPayment,
} = require("../controller/KHQRController");

const KHQRRoute = (app) => {
  console.log("🔧 Registering KHQR Routes...");

  // Generate KHQR for payment
  app.post("/api/khqr/generate", generateKHQR);
  app.post("/api/khqr/generate/:id", generateKHQR);

  // Verify payment status (GET - without Bakong API check)
  app.get("/api/khqr/verify/:md5", verifyPayment);

  // Confirm payment status (POST - with Bakong API check)
  app.post("/api/khqr/confirm/:md5", confirmPayment);

  // Manual confirm when Bakong cannot auto-verify
  app.post("/api/khqr/manual-confirm/:md5", manualConfirmPayment);

  // Check payment (legacy)
  app.post("/api/khqr/check", checkPayment);

  // Test endpoints
  app.post("/api/khqr/mark-paid/:md5", markPaymentAsPaid);
  app.post("/api/khqr/reset-paid/:md5", resetPaymentAsUnpaid);

  // Order-specific routes (legacy support)
  app.post("/api/orders/:id/generate_qrcode", generateKHQR);
  app.post("/api/orders/:id/check_payment", checkPayment);

  console.log("✅ KHQR Routes registered");
  console.log("   POST   /api/khqr/generate");
  console.log("   POST   /api/khqr/confirm/:md5");
  console.log("   POST   /api/khqr/manual-confirm/:md5");
  console.log("   GET    /api/khqr/verify/:md5");
};

module.exports = KHQRRoute;
