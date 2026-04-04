const axios = require("axios");
const { formatCambodiaDate } = require("./dateHelper");

const sendTelegramMessage = async (text) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.log("Telegram bot token or chat ID is not configured - skipping notification");
      return;
    }
    console.log("Sending Telegram message to chat ID:", chatId);
    
    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    });
    
    console.log("✅ Telegram notification sent successfully! Message ID:", response.data.result.message_id);
  } catch (error) {
    console.error("❌ Telegram send error:");
    console.error("   Status:", error.response?.status);
    console.error("   Error:", error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.error("   Possible causes:");
      console.error("   - Chat ID is incorrect");
      console.error("   - You have not started a conversation with the bot (send /start)");
      console.error("   - Bot is blocked by the user");
    }
  }
};

const sendTelegramPhoto = async (photoBuffer, caption = '') => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.log("Telegram bot token or chat ID is not configured - skipping photo notification");
      return;
    }
    
    console.log("Sending Telegram photo to chat ID:", chatId);
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', photoBuffer, { filename: 'receipt.png' });
    if (caption) {
      form.append('caption', caption);
      form.append('parse_mode', 'HTML');
    }
    
    const response = await axios.post(
      `https://api.telegram.org/bot${token}/sendPhoto`,
      form,
      { headers: form.getHeaders() }
    );
    
    console.log("✅ Telegram photo sent successfully! Message ID:", response.data.result.message_id);
    return response.data;
  } catch (error) {
    console.error("❌ Telegram photo send error:");
    console.error("   Status:", error.response?.status);
    console.error("   Error:", error.response?.data || error.message);
    throw error;
  }
};

const alertNewSale = async (sale) => {
  try {
    // Use created_on for accurate timestamp with time, fallback to sale_date
    const dateToFormat = sale.created_on || sale.sale_date || new Date();
    console.log('📅 Input to format:', dateToFormat, 'Type:', typeof dateToFormat);
    
    const formattedDate = formatCambodiaDate(dateToFormat);
    console.log('✅ Formatted output:', formattedDate, 'Type:', typeof formattedDate);
    
    const message =
      `🧾 <b>New Sale</b>\n\n` +
      `<b>Sale ID:</b> ${sale.sale_id}\n` +
      `<b>Invoice ID:</b> ${sale.invoice_id}\n` +
      `<b>Amount:</b> $${parseFloat(sale.amount || 0).toFixed(2)}\n` +
      `<b>Subtotal:</b> $${parseFloat(sale.sub_total || 0).toFixed(2)}\n` +
      `<b>Tax:</b> $${parseFloat(sale.tax || 0).toFixed(2)}\n` +
      `<b>Payment Method:</b> ${sale.pay_method}\n` +
      `<b>Date:</b> ${formattedDate}\n` +
      `<b>Created By:</b> ${sale.create_by}`;

    console.log('📤 Sending message with formatted date');
    await sendTelegramMessage(message);
  } catch (error) {
    console.error('❌ Error in alertNewSale:', error.message);
  }
};


// new order
const alertOrder = async (sale) => {
  try {
    // Use created_on for accurate timestamp with time, fallback to sale_date
    const dateToFormat = sale.created_on || sale.sale_date || new Date();
    console.log('📅 Input to format:', dateToFormat, 'Type:', typeof dateToFormat);
    
    const formattedDate = formatCambodiaDate(dateToFormat);
    console.log('✅ Formatted output:', formattedDate, 'Type:', typeof formattedDate);
    
    const message =
      `🧾 <b> New Order </b>\n\n` +
      `<b>Sale ID:</b> ${sale.sale_id}\n` +
      `<b>Invoice ID:</b> ${sale.invoice_id}\n` +
      `<b>Amount:</b> $${parseFloat(sale.amount || 0).toFixed(2)}\n` +
      `<b>Subtotal:</b> $${parseFloat(sale.sub_total || 0).toFixed(2)}\n` +
      `<b>Tax:</b> $${parseFloat(sale.tax || 0).toFixed(2)}\n` +
      `<b>Payment Method:</b> ${sale.pay_method}\n` +
      `<b>Date:</b> ${formattedDate}\n` +
      `<b>Created By:</b> ${sale.create_by}`;

    console.log('📤 Sending message with formatted date');
    await sendTelegramMessage(message);
  } catch (error) {
    console.error('❌ Error in alertNewSale:', error.message);
  }
};
const alertLowStock = async (product) => {
  const message =
    `⚠️ <b>Low Stock Alert</b>\n\n` +
    `<b>Product ID:</b> ${product.prd_id}\n` +
    `<b>Name:</b> ${product.prd_name}\n` +
    `<b>Quantity Left:</b> ${product.qty}\n` +
    `<b>Status:</b> Low Stock (≤10 items)`;

  await sendTelegramMessage(message);
};

const alertOutOfStock = async (product) => {
  const message =
    `❌ <b>Out of Stock Alert</b>\n\n` +
    `<b>Product ID:</b> ${product.prd_id}\n` +
    `<b>Name:</b> ${product.prd_name}\n` +
    `<b>Quantity:</b> ${product.qty}\n` +
    `<b>Status:</b> OUT OF STOCK`;

  await sendTelegramMessage(message);
};

const alertNewOrder = async (order, items = []) => {
  try {
    const dateToFormat = order.created_on || new Date();
    const formattedDate = formatCambodiaDate(dateToFormat);
    
    // Build items list
    let itemsList = '';
    if (items && items.length > 0) {
      itemsList = '\n\n<b>Items:</b>\n';
      items.forEach((item, index) => {
        itemsList += `${index + 1}. ${item.prd_id} - Qty: ${item.qty} × $${parseFloat(item.unit_price || 0).toFixed(2)}\n`;
      });
    }
    
    const message =
      `🛒 <b>New Online Order</b>\n\n` +
      `<b>Order ID:</b> ${order.order_id}\n` +
      `<b>Customer:</b> ${order.fullname}\n` +
      `<b>Email:</b> ${order.email}\n` +
      `<b>Address:</b> ${order.address || 'No address provided'}\n` +
      `<b>Postal Code:</b> ${order.postalcode && order.postalcode !== 0 ? order.postalcode : 'Not provided'}\n` +
      `<b>Total Amount:</b> $${parseFloat(order.amount || 0).toFixed(2)}\n` +
      `<b>Payment Status:</b> ${order.status_payment}\n` +
      `<b>Date:</b> ${formattedDate}` +
      itemsList;

    console.log('📤 Sending new order notification to Telegram');
    await sendTelegramMessage(message);
  } catch (error) {
    console.error('❌ Error in alertNewOrder:', error.message);
  }
};

module.exports = {
  sendTelegramMessage,
  sendTelegramPhoto,
  alertNewSale,
  alertLowStock,
  alertOutOfStock,
  alertNewOrder,
};
