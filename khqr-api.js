// khqr-api.js - Place this in your backend root folder
const express = require("express");
const router = express.Router();

// In-memory storage for testing (replace with database later)
const orders = new Map();

// Generate KHQR
router.post("/generate", (req, res) => {
  const { amount = 0.03, currency = "USD" } = req.body;
  
  console.log("========================================");
  console.log("🔧 Generating KHQR");
  console.log("Amount:", amount, "Currency:", currency);
  console.log("========================================");
  
  const selectedCurrency = currency.toUpperCase();
  let displayAmount = Number(amount);
  
  // Generate unique MD5
  const uniqueId = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const qrMd5 = `${uniqueId}_${randomStr}_${selectedCurrency}_${displayAmount}`;
  
  // Mock QR code
  const qrCode = `00020101021129210017khin_yin1999@bkrt5204${uniqueId}9953031165802KH5903SHOPPING6304${Math.floor(Math.random() * 9999)}`;
  
  // Save order
  const order = {
    id: uniqueId,
    qr_code: qrCode,
    qr_md5: qrMd5,
    amount: displayAmount,
    currency: selectedCurrency,
    status: "pending",
    paid: false,
    paid_at: null,
    created_at: new Date().toISOString()
  };
  
  orders.set(qrMd5, order);
  
  console.log("✅ KHQR Generated!");
  console.log("📱 MD5:", qrMd5);
  console.log("💰 Amount:", displayAmount, selectedCurrency);
  console.log("========================================\n");
  
  res.json({
    success: true,
    message: "KHQR generated successfully!",
    data: {
      id: order.id,
      qr_code: qrCode,
      qr_md5: qrMd5,
      amount: displayAmount,
      currency: selectedCurrency,
      status: "pending",
      paid: false
    }
  });
});

// Confirm payment
router.post("/confirm/:md5", (req, res) => {
  const { md5 } = req.params;
  console.log("🔍 Verifying payment for MD5:", md5);
  
  const order = orders.get(md5);
  
  if (!order) {
    console.log("❌ Order not found!");
    return res.status(404).json({
      success: false,
      message: "QR order not found"
    });
  }
  
  // If already paid
  if (order.paid) {
    console.log("✅ Payment already confirmed!");
    return res.json({
      success: true,
      message: "Payment already confirmed",
      data: order
    });
  }
  
  // For testing - auto confirm after 10 seconds
  // This simulates payment success
  if (!order.paid && !order.markedForPayment) {
    order.markedForPayment = true;
    
    // Auto confirm after 10 seconds (simulate payment)
    setTimeout(() => {
      order.paid = true;
      order.status = "paid";
      order.paid_at = new Date().toISOString();
      orders.set(md5, order);
      console.log("💰💰💰 AUTO PAYMENT CONFIRMED for MD5:", md5);
    }, 10000); // 10 seconds delay
  }
  
  // Check if already marked as paid
  if (order.paid) {
    return res.json({
      success: true,
      message: "Payment confirmed!",
      data: order
    });
  }
  
  // Not paid yet
  console.log("⏳ Waiting for payment...");
  return res.status(404).json({
    success: false,
    message: "Payment not completed yet. Please scan QR code and pay.",
    data: order
  });
});

// Verify payment status
router.get("/verify/:md5", (req, res) => {
  const { md5 } = req.params;
  const order = orders.get(md5);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "QR order not found"
    });
  }
  
  res.json({
    success: true,
    data: order
  });
});

// Manual mark as paid (for testing)
router.post("/mark-paid/:md5", (req, res) => {
  const { md5 } = req.params;
  const order = orders.get(md5);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }
  
  order.paid = true;
  order.status = "paid";
  order.paid_at = new Date().toISOString();
  orders.set(md5, order);
  
  console.log("✅ Manually marked as paid:", md5);
  
  res.json({
    success: true,
    message: "Payment marked as paid",
    data: order
  });
});

module.exports = router;