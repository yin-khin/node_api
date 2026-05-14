const axios = require("axios");
const crypto = require("crypto");
const { BakongKHQR, khqrData, IndividualInfo } = require("bakong-khqr");
const KHQROrder = require("../model/KHQROrderModel");

const EXCHANGE_RATE = 4100;
const MOCK_PAYMENT_MODE = process.env.MOCK_PAYMENT_MODE === "true";

console.log("========================================");
console.log("KHQR Configuration:");
console.log("MOCK_PAYMENT_MODE:", MOCK_PAYMENT_MODE);
console.log("========================================");

const getMerchantName = () => process.env.BAKONG_ACCOUNT_NAME || "SHOPPING";
const getMerchantCity = () => process.env.KHQR_MERCHANT_CITY || "PHNOM PENH";
const getBakongAccount = () => process.env.BAKONG_ACCOUNT_USERNAME;
const getBakongAccessToken = () => process.env.BAKONG_ACCESS_TOKEN;
const getBakongApiUrl = () =>
  process.env.BAKONG_PROD_BASE_API_URL || "https://api-bakong.nbc.gov.kh/v1";

const buildQrResponse = (order) => ({
  id: order.id,
  userId: order.userId,
  qr_code: order.qr_code,
  qr_md5: order.qr_md5,
  qrCode: order.qr_code,
  md5Hash: order.qr_md5,
  amount: Number(order.amount),
  currency: order.currency,
  status: order.status,
  paid: order.paid,
  paid_at: order.paid_at || null,
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique MD5 based on orderId, amount, currency, and timestamp
const generateUniqueMd5 = (orderId, amount, currency, timestamp) => {
  const uniqueString = `${orderId}_${amount}_${currency}_${timestamp}_${Math.random()}_${Date.now()}`;
  return crypto.createHash("md5").update(uniqueString).digest("hex");
};

async function updateMainOrderPaymentStatus(userId) {
  try {
    if (!userId || userId === "") {
      console.log("⚠️ No userId provided for main order update");
      return false;
    }

    console.log(`📌 Updating main order status for order_id: ${userId}`);

    const Order = require("../model/OrderModel");

    const mainOrder = await Order.findOne({ where: { order_id: userId } });

    if (!mainOrder) {
      console.log(`❌ Main order with order_id ${userId} not found`);
      return false;
    }

    if (mainOrder.status_payment === "completed") {
      console.log(`✅ Main order already completed`);
      return true;
    }

    const [updatedCount] = await Order.update(
      { status_payment: "completed", changed_on: new Date() },
      { where: { order_id: userId } },
    );

    if (updatedCount > 0) {
      console.log(
        `✅ Updated main order ${userId} status_payment to completed`,
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error updating main order status:", error);
    return false;
  }
}

async function sendTelegramPaymentNotification(orderId) {
  try {
    const { alertNewOrder } = require("../utils/telegramBot");
    const Order = require("../model/OrderModel");

    const order = await Order.findOne({ where: { order_id: orderId } });

    if (order && order.status_payment === "completed") {
      await alertNewOrder(order, []);
      console.log(`✅ Telegram notification sent for order ${orderId}`);
    } else {
      console.log(`⚠️ Order ${orderId} not ready for Telegram notification`);
    }
  } catch (error) {
    console.error("❌ Telegram notification error:", error);
  }
}

const findOrderByMd5 = async (md5) => {
  if (!md5) return null;
  return KHQROrder.findOne({ where: { qr_md5: md5 } });
};

// ============================================
// GENERATE STATIC KHQR WITH UNIQUE MD5
// ============================================

const generateKHQR = async (req, res) => {
  const { id } = req.params;
  const { amount = 0.03, currency = "USD", orderId } = req.body || {};

  try {
    const accountUsername = getBakongAccount();
    const merchantName = getMerchantName();
    const merchantCity = getMerchantCity();

    console.log("========================================");
    console.log("🔧 Generating STATIC KHQR");
    console.log("Account:", accountUsername);
    console.log("Amount:", amount, "Currency:", currency);
    console.log("OrderId from body:", orderId);
    console.log("Id from params:", id);
    console.log("========================================");

    if (!accountUsername) {
      return res.status(500).json({
        success: false,
        message: "BAKONG_ACCOUNT_USERNAME not configured in .env",
      });
    }

    const selectedCurrency = currency.toUpperCase();
    let displayAmount = Number.isFinite(amount) && amount > 0 ? amount : 0.03;
    let amountForQR;

    if (selectedCurrency === "USD") {
      amountForQR = Math.round(displayAmount * 100);
    } else {
      amountForQR = Math.round(displayAmount);
    }

    console.log(`💰 Amount for QR: ${amountForQR} ${selectedCurrency}`);

    const expirationTimestamp = Date.now() + 15 * 60 * 1000;
    const currencyCode =
      selectedCurrency === "USD"
        ? khqrData.currency.usd
        : khqrData.currency.khr;

    const optionalData = {
      currency: currencyCode,
      amount: amountForQR,
      expirationTimestamp,
      billNumber: `BILL_${Date.now()}`,
      mobileNumber: process.env.BAKONG_PHONE_NUMBER || "0887914573",
      storeLabel: merchantName,
      terminalLabel: "POS001",
      merchantCategoryCode: "5999",
      acquiringBank: process.env.ACQUIRING_BANK || "ABA Bank",
    };

    const individualInfo = new IndividualInfo(
      accountUsername,
      currencyCode,
      merchantName,
      merchantCity,
      optionalData,
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(individualInfo);

    let qrCode = null;
    let qrMd5FromLib = null;

    if (result?.data) {
      qrCode = result.data.qr;
      qrMd5FromLib = result.data.md5 || result.data.md5Hash;
    } else if (result?.qr) {
      qrCode = result.qr;
      qrMd5FromLib = result.md5;
    }

    if (!qrCode) {
      console.error("KHQR generation failed:", JSON.stringify(result, null, 2));
      return res.status(500).json({
        success: false,
        message: result?.status?.message || "Failed to generate KHQR code",
      });
    }

    console.log(`✅ QR Code generated successfully`);
    console.log(`⚠️ Library MD5 (not used): ${qrMd5FromLib}`);

    const finalOrderId = orderId || id;
    console.log(`📌 Final Order ID to store: ${finalOrderId}`);

    if (!finalOrderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // ✅ Generate UNIQUE MD5 based on orderId + timestamp
    const uniqueMd5 = generateUniqueMd5(
      finalOrderId,
      displayAmount,
      selectedCurrency,
      Date.now(),
    );
    console.log(`✅ Generated UNIQUE MD5: ${uniqueMd5}`);

    // Check if there's an existing unpaid order for this userId
    let order = await KHQROrder.findOne({
      where: {
        userId: String(finalOrderId),
        paid: false,
      },
    });

    if (order) {
      // Update existing order with new QR and unique MD5
      await order.update({
        qr_code: qrCode,
        qr_md5: uniqueMd5,
        qr_expiration: new Date(expirationTimestamp),
        amount: displayAmount,
        currency: selectedCurrency,
        status: "pending",
        paid: false,
        paid_at: null,
        transaction_id: null,
      });
      console.log(
        `🔄 Updated existing KHQR order with new unique MD5: ${uniqueMd5}`,
      );
    } else {
      // Check if any order exists with this MD5 (should not happen with unique MD5)
      const existingByMd5 = await KHQROrder.findOne({
        where: { qr_md5: uniqueMd5 },
      });
      if (existingByMd5) {
        console.log(`⚠️ MD5 collision detected! Regenerating...`);
        const newUniqueMd5 = generateUniqueMd5(
          finalOrderId,
          displayAmount,
          selectedCurrency,
          Date.now() + 1,
        );
        console.log(`✅ New unique MD5: ${newUniqueMd5}`);

        order = await KHQROrder.create({
          userId: String(finalOrderId),
          amount: displayAmount,
          currency: selectedCurrency,
          payment_method: "khqr",
          qr_code: qrCode,
          qr_md5: newUniqueMd5,
          qr_expiration: new Date(expirationTimestamp),
          status: "pending",
          paid: false,
        });
      } else {
        // Create new order with unique MD5
        order = await KHQROrder.create({
          userId: String(finalOrderId),
          amount: displayAmount,
          currency: selectedCurrency,
          payment_method: "khqr",
          qr_code: qrCode,
          qr_md5: uniqueMd5,
          qr_expiration: new Date(expirationTimestamp),
          status: "pending",
          paid: false,
        });
      }
      console.log(`✅ Created new KHQR order with unique MD5: ${order.qr_md5}`);
    }

    return res.status(200).json({
      success: true,
      message: "KHQR generated successfully!",
      data: buildQrResponse(order),
    });
  } catch (error) {
    console.error("KHQR generation error:", error);

    // Handle duplicate entry error gracefully
    if (
      error.name === "SequelizeUniqueConstraintError" ||
      error.code === "ER_DUP_ENTRY"
    ) {
      console.log("⚠️ Duplicate entry detected, retrying with new MD5...");

      const finalOrderId = req.body.orderId || req.params.id;
      const amount = req.body.amount || 0.03;
      const currency = req.body.currency || "USD";

      try {
        const newUniqueMd5 = generateUniqueMd5(
          finalOrderId,
          amount,
          currency,
          Date.now(),
        );
        console.log(`✅ Retry with new MD5: ${newUniqueMd5}`);

        const newOrder = await KHQROrder.create({
          userId: String(finalOrderId),
          amount: amount,
          currency: currency.toUpperCase(),
          payment_method: "khqr",
          qr_code: "RETRY_GENERATED",
          qr_md5: newUniqueMd5,
          qr_expiration: new Date(Date.now() + 15 * 60 * 1000),
          status: "pending",
          paid: false,
        });

        return res.status(200).json({
          success: true,
          message: "KHQR generated successfully on retry!",
          data: buildQrResponse(newOrder),
        });
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
        return res.status(500).json({
          success: false,
          message: "Failed to generate KHQR after retry",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CONFIRM PAYMENT - Check with Bakong API
// ============================================

const confirmPayment = async (req, res) => {
  try {
    const { md5 } = req.params;
    console.log(`\n🔍 ===== CHECKING PAYMENT WITH BAKONG API =====`);
    console.log(`MD5: ${md5}`);

    const order = await findOrderByMd5(md5);

    if (!order) {
      console.log("❌ Order not found");
      return res.status(404).json({
        success: false,
        message: "QR order not found",
      });
    }

    console.log(
      `📋 Order: userId=${order.userId}, paid=${order.paid}, status=${order.status}`,
    );

    if (order.paid === true) {
      console.log("✅ Payment already confirmed");
      return res.status(200).json({
        success: true,
        message: "Payment already confirmed",
        data: buildQrResponse(order),
      });
    }

    if (order.qr_expiration && new Date() > new Date(order.qr_expiration)) {
      console.log("⏰ QR code expired");
      return res.status(200).json({
        success: false,
        message: "QR code has expired. Please generate a new one.",
        data: buildQrResponse(order),
      });
    }

    // Check with Bakong API
    const apiUrl = getBakongApiUrl();
    const accessToken = getBakongAccessToken();

    if (apiUrl && accessToken && !MOCK_PAYMENT_MODE) {
      try {
        console.log(
          `📡 Calling Bakong API: ${apiUrl}/check_transaction_by_md5`,
        );

        const response = await axios.post(
          `${apiUrl}/check_transaction_by_md5`,
          { md5: md5 },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        );

        const paymentData = response.data;
        console.log(`📡 Bakong Response Code: ${paymentData?.responseCode}`);
        console.log(
          `📡 Bakong Response Message: ${paymentData?.responseMessage}`,
        );

        // responseCode 0 means payment found
        if (paymentData?.responseCode === 0 && paymentData?.data?.hash) {
          console.log("✅ PAYMENT FOUND IN BAKONG! Updating database...");

          await order.update({
            paid: true,
            status: "paid",
            paid_at: new Date(),
            transaction_id: paymentData.data.hash,
            fromAccountId: paymentData.data.fromAccountId,
            toAccountId: paymentData.data.toAccountId,
            description: paymentData.data.description,
          });

          if (order.userId) {
            await updateMainOrderPaymentStatus(order.userId);
            await sendTelegramPaymentNotification(order.userId);
          }

          return res.status(200).json({
            success: true,
            message: "Payment confirmed!",
            data: buildQrResponse(order),
          });
        }

        // responseCode 1 means static QR - needs manual check
        if (paymentData?.responseCode === 1) {
          console.log("⚠️ Static QR - Manual check required");
          return res.status(200).json({
            success: false,
            message:
              "Please confirm payment manually after completing transaction",
            data: buildQrResponse(order),
            requiresManualCheck: true,
          });
        }
      } catch (apiError) {
        console.error(
          "❌ Bakong API error:",
          apiError.response?.data || apiError.message,
        );
      }
    }

    console.log("⏳ Payment not found yet - requires manual check");
    return res.status(200).json({
      success: false,
      message:
        "Please complete payment in your banking app, then click confirm.",
      data: buildQrResponse(order),
      requiresManualCheck: true,
    });
  } catch (error) {
    console.error("❌ Confirm payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// MANUAL CONFIRM PAYMENT
// ============================================

const manualConfirmPayment = async (req, res) => {
  try {
    const { md5 } = req.params;
    console.log(`🔧 MANUAL CONFIRM for MD5: ${md5}`);

    const order = await findOrderByMd5(md5);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(`📋 Order: userId=${order.userId}, paid=${order.paid}`);

    if (order.paid) {
      console.log("✅ Payment already confirmed");
      return res.status(200).json({
        success: true,
        message: "Payment already confirmed",
        data: buildQrResponse(order),
      });
    }

    await order.update({
      paid: true,
      status: "paid",
      paid_at: new Date(),
      transaction_id: `MANUAL_${Date.now()}`,
    });

    console.log(`✅ KHQR order updated to paid`);

    if (order.userId && order.userId !== "") {
      const mainOrderUpdated = await updateMainOrderPaymentStatus(order.userId);
      if (mainOrderUpdated) {
        console.log(`✅ Main order ${order.userId} updated to completed`);
      } else {
        console.log(`⚠️ Could not update main order ${order.userId}`);
      }
      await sendTelegramPaymentNotification(order.userId);
    } else {
      console.log(
        "⚠️ No userId found in KHQR order - cannot update main order",
      );
    }

    const updatedOrder = await findOrderByMd5(md5);

    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully!",
      data: buildQrResponse(updatedOrder),
    });
  } catch (error) {
    console.error("Manual confirm error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// VERIFY PAYMENT (LOCAL ONLY)
// ============================================

const verifyPayment = async (req, res) => {
  try {
    const { md5 } = req.params;
    console.log(`🔍 Verifying local payment status for MD5: ${md5}`);

    const order = await findOrderByMd5(md5);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "QR order not found",
      });
    }

    console.log(`📋 Order status: paid=${order.paid}, status=${order.status}`);

    return res.status(200).json({
      success: order.paid === true,
      data: buildQrResponse(order),
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CHECK PAYMENT
// ============================================

const checkPayment = async (req, res) => {
  try {
    const { qr_md5 } = req.body;

    if (!qr_md5) {
      return res.status(400).json({
        success: false,
        message: "Missing qr_md5 parameter",
      });
    }

    const order = await findOrderByMd5(qr_md5);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paid === true && order.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already confirmed",
        data: buildQrResponse(order),
      });
    }

    return confirmPayment(req, res);
  } catch (error) {
    console.error("Check payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// TEST FUNCTIONS
// ============================================

const markPaymentAsPaid = async (req, res) => {
  try {
    const { md5 } = req.params;
    const order = await findOrderByMd5(md5);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.update({
      paid: true,
      status: "paid",
      paid_at: new Date(),
      transaction_id: `TEST_${Date.now()}`,
    });

    if (order.userId && order.userId !== "") {
      await updateMainOrderPaymentStatus(order.userId);
    }

    console.log(`✅ Manually marked as paid: ${md5}`);

    return res.status(200).json({
      success: true,
      message: "Payment marked as paid (test)",
      data: buildQrResponse(order),
    });
  } catch (error) {
    console.error("Mark as paid error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const resetPaymentAsUnpaid = async (req, res) => {
  try {
    const { md5 } = req.params;
    const order = await findOrderByMd5(md5);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.update({
      paid: false,
      status: "pending",
      paid_at: null,
      transaction_id: null,
    });

    console.log(`🧹 Reset payment to unpaid: ${md5}`);

    return res.status(200).json({
      success: true,
      message: "Payment reset to unpaid (test)",
      data: buildQrResponse(order),
    });
  } catch (error) {
    console.error("Reset unpaid error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  generateKHQR,
  verifyPayment,
  confirmPayment,
  checkPayment,
  markPaymentAsPaid,
  resetPaymentAsUnpaid,
  manualConfirmPayment,
};
