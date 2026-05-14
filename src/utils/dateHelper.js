/**
 * Format date to Cambodia timezone (Phnom Penh)
 * Returns: 03/07/2026, 10:12:00 PM
 */
const formatCambodiaDate = (date) => {
  if (!date) {
    console.log("⚠️ No date provided");
    return "No date";
  }

  try {
    console.log("📅 Input date:", date, "Type:", typeof date);

    // Convert to Date object if string
    let dateObj = date;
    if (typeof date === "string") {
      dateObj = new Date(date);
    }

    // Validate date
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.error("❌ Invalid date object");
      return "Invalid date";
    }

    console.log("📅 Date object created:", dateObj.toISOString());

    // Convert to Cambodia timezone using UTC offset (+7 hours)
    const utcTime = dateObj.getTime();
    const cambodiaOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const cambodiaTime = new Date(utcTime + cambodiaOffset);

    // Extract components
    const year = cambodiaTime.getUTCFullYear();
    const month = String(cambodiaTime.getUTCMonth() + 1).padStart(2, "0");
    const day = String(cambodiaTime.getUTCDate()).padStart(2, "0");

    let hours = cambodiaTime.getUTCHours();
    const minutes = String(cambodiaTime.getUTCMinutes()).padStart(2, "0");
    const seconds = String(cambodiaTime.getUTCSeconds()).padStart(2, "0");

    // Convert to 12-hour format
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    const formatted = `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;

    console.log("✅ Formatted result:", formatted);
    return formatted;
  } catch (error) {
    console.error("❌ Error in formatCambodiaDate:", error.message);
    console.error("Stack:", error.stack);
    return "Error formatting date";
  }
};

const formatCambodiaDateShort = (date) => {
  if (!date) return "";

  try {
    let dateObj = date;
    if (typeof date === "string") {
      dateObj = new Date(date);
    }

    if (!dateObj || isNaN(dateObj.getTime())) {
      return "";
    }

    const utcTime = dateObj.getTime();
    const cambodiaOffset = 7 * 60 * 60 * 1000;
    const cambodiaTime = new Date(utcTime + cambodiaOffset);

    const year = cambodiaTime.getUTCFullYear();
    const month = String(cambodiaTime.getUTCMonth() + 1).padStart(2, "0");
    const day = String(cambodiaTime.getUTCDate()).padStart(2, "0");

    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error("Error formatting date short:", error);
    return "";
  }
};

const getCambodiaDate = () => {
  return new Date();
};

const getCambodiaDateString = () => {
  const now = new Date();
  const utcTime = now.getTime();
  const cambodiaOffset = 7 * 60 * 60 * 1000;
  const cambodiaTime = new Date(utcTime + cambodiaOffset);

  const year = cambodiaTime.getUTCFullYear();
  const month = String(cambodiaTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(cambodiaTime.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCambodiaDateTimeString = () => {
  return new Date().toISOString();
};

module.exports = {
  getCambodiaDate,
  formatCambodiaDate,
  formatCambodiaDateShort,
  getCambodiaDateString,
  getCambodiaDateTimeString,
};
