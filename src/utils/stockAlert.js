const { alertLowStock, alertOutOfStock } = require("./telegramBot");
const GeneralSetting = require("../model/GeneralSettingModel");

const getStockAlertThreshold = async () => {
  try {
    const settings = await GeneralSetting.findOne();
    if (settings && settings.stock_alert) {
      return parseInt(settings.stock_alert);
    }
    return 10; // Default threshold
  } catch (error) {
    console.error("Error getting stock alert threshold:", error);
    return 10; // Default threshold
  }
};

const getAlertSettings = async () => {
  try {
    const settings = await GeneralSetting.findOne();
    if (settings) {
      return {
        lowStockEnabled: (settings.is_alert & 1) === 1,
        availableStockEnabled: (settings.is_alert & 2) === 2,
        unavailableStockEnabled: (settings.is_alert & 4) === 4,
        threshold: parseInt(settings.stock_alert) || 10,
      };
    }
    return {
      lowStockEnabled: true,
      availableStockEnabled: false,
      unavailableStockEnabled: true,
      threshold: 10,
    };
  } catch (error) {
    console.error("Error getting alert settings:", error);
    return {
      lowStockEnabled: true,
      availableStockEnabled: false,
      unavailableStockEnabled: true,
      threshold: 10,
    };
  }
};

const checkAndAlertStockLevels = async (product) => {
  try {
    const alertSettings = await getAlertSettings();
    const qty = parseInt(product.qty || 0);

    console.log(
      `\n📊 Checking product: ${product.prd_id} - ${product.prd_name}`,
    );
    console.log(`   Quantity: ${qty}`);
    console.log(`   Threshold: ${alertSettings.threshold}`);
    console.log(`   Low Stock Enabled: ${alertSettings.lowStockEnabled}`);
    console.log(
      `   Out of Stock Enabled: ${alertSettings.unavailableStockEnabled}`,
    );

    if (qty === 0 && alertSettings.unavailableStockEnabled) {
      // Out of stock
      console.log(`   ❌ OUT OF STOCK - Sending alert...`);
      await alertOutOfStock(product);
      console.log(
        `   ✅ Out of stock alert sent for product: ${product.prd_name}`,
      );
    } else if (
      qty <= alertSettings.threshold &&
      qty > 0 &&
      alertSettings.lowStockEnabled
    ) {
      // Low stock (threshold or fewer items)
      console.log(`   ⚠️  LOW STOCK - Sending alert...`);
      await alertLowStock(product);
      console.log(
        `   ✅ Low stock alert sent for product: ${product.prd_name}`,
      );
    } else {
      console.log(`   ✓ Stock level OK - No alert needed`);
    }
  } catch (error) {
    console.error("Error checking stock levels:", error);
  }
};

const checkMultipleProductsStock = async (products) => {
  try {
    for (const product of products) {
      await checkAndAlertStockLevels(product);
    }
  } catch (error) {
    console.error("Error checking multiple products stock:", error);
  }
};

module.exports = {
  checkAndAlertStockLevels,
  checkMultipleProductsStock,
  getStockAlertThreshold,
};
