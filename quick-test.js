// quick-test.js
require("dotenv").config();

console.log("\n=== Testing .env Configuration ===\n");

// Check if .env variables are loaded
console.log("Environment Variables:");
console.log(
  `BAKONG_ACCOUNT: ${
    process.env.BAKONG_ACCOUNT || process.env.BAKONG_ACCOUNT_USERNAME ? "✅ Loaded" : "❌ Not loaded"
  }`,
);
console.log(
  `BAKONG_TOKEN: ${
    process.env.BAKONG_ACCESS_TOKEN || process.env.BAKONG_TOKEN ? "✅ Loaded" : "❌ Not loaded"
  }`,
);
console.log(`MERCHANT_NAME: ${process.env.MERCHANT_NAME || "⚠️ Using default"}`);

const getBakongAccount = () =>
  process.env.BAKONG_ACCOUNT || process.env.BAKONG_ACCOUNT_USERNAME || process.env.BAKONG_ACCOUNT_NUMBER;

const getBakongAccessToken = () =>
  process.env.BAKONG_ACCESS_TOKEN || process.env.BAKONG_TOKEN;

// Test actual QR generation
if (getBakongAccount() && getBakongAccessToken()) {
  const { BakongKHQR, khqrData, IndividualInfo } = require("bakong-khqr");

  const merchantName = process.env.MERCHANT_NAME || "Test Store";
  const acquiringBank = process.env.ACQUIRING_BANK || "Test Bank";

  // bakong-khqr expects optionalData tags like currency/amount/billNumber
  const currency = 1; // 1 => KHR, 2 => USD (matches what your code uses elsewhere)

  const individualInfo = new IndividualInfo(
    getBakongAccount(),
    currency === 1 ? khqrData.currency.khr : khqrData.currency.usd,
    merchantName,
    process.env.MERCHANT_CITY || "Phnom Penh",
    {
      currency: currency === 1 ? khqrData.currency.khr : khqrData.currency.usd,
      amount: 1000,
      billNumber: `TEST_${Date.now()}`,
      mobileNumber: process.env.KHQR_MOBILE_NUMBER || "85500000000",
      storeLabel: process.env.KHQR_STORE_LABEL || merchantName,
      terminalLabel: process.env.KHQR_TERMINAL_LABEL || "POS001",
      expirationTimestamp:
        Date.now() + Number(process.env.KHQR_EXPIRY_MINUTES || 2) * 60 * 1000,
      merchantCategoryCode:
        process.env.KHQR_MERCHANT_CATEGORY_CODE || "5999",
      // optional: attaching acquiringBank-like info isn't required for generateIndividual,
      // but keeping acquiringBank value from env helps you spot misconfig if needed.
      // (bakong-khqr derives acquiring bank internally)
      acquiringBank,
    },
  );

  const khqr = new BakongKHQR();

  const result = khqr.generateIndividual(individualInfo);

  console.log("\nQR Generation Result:");
  const code = result?.status?.code ?? null;
  console.log(code === 0 ? "✅ Success!" : `❌ Failed (code=${code})`);

  if (code !== 0) {
    console.log("Error message:", result?.status?.message || JSON.stringify(result));
    process.exit(0);
  }

  // result may contain { qrCode/md5 } depending on library version
  const qrString =
    result?.data?.qr ||
    result?.qrCode ||
    result?.data?.qrCode ||
    result?.qr ||
    JSON.stringify(result?.data || result);

  console.log("\n📊 Verification check (CRC validity):");
  const verification = BakongKHQR.verify(qrString);
  console.log(verification?.isValid ? "✅ CRC Valid" : "❌ CRC Invalid");

  // Save for inspection
  const fs = require("fs");
  fs.writeFileSync("generated-qr.json", JSON.stringify(result, null, 2));
  console.log("\n💾 QR data saved to generated-qr.json");
} else {
  console.log("\n❌ Please configure your .env file first");
  console.log("Missing:");
  if (!process.env.BAKONG_ACCOUNT) console.log("- BAKONG_ACCOUNT");
  if (!process.env.BAKONG_TOKEN) console.log("- BAKONG_TOKEN");
  console.log("Run: npm run setup\n");
}
