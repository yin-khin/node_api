const axios = require("axios");

const sendTelegramMessage = async (text) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("Telegram bot token or chat ID is not configured");
      return;
    }

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  } catch (error) {
    console.error(
      "Telegram send error:",
      error.response?.data || error.message,
    );
  }
};

const alertNewSale = async (sale) => {
  const message =
    `🧾 New Sale Created\n` +
    `Sale ID: ${sale.sale_id}\n` +
    `Invoice ID: ${sale.invoice_id}\n` +
    `Amount: ${sale.amount}\n` +
    `Payment: ${sale.pay_method}\n` +
    `Date: ${sale.sale_date}`;

  await sendTelegramMessage(message);
};

const alertLowStock = async (product) => {
  const message =
    `⚠️ Low Stock Alert\n` +
    `Product ID: ${product.id}\n` +
    `Name: ${product.name}\n` +
    `Qty Left: ${product.qty}`;

  await sendTelegramMessage(message);
};

const alertOutOfStock = async (product) => {
  const message =
    `❌ Out of Stock Alert\n` +
    `Product ID: ${product.id}\n` +
    `Name: ${product.name}\n` +
    `Qty Left: ${product.qty}`;

  await sendTelegramMessage(message);
};

module.exports = {
  sendTelegramMessage,
  alertNewSale,
  alertLowStock,
  alertOutOfStock,
};
