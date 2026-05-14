const nodemailer = require("nodemailer");

// Create transporter using environment variables
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send email
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    const info = await mailer.sendMail(mailOptions);

    return {
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email error:", error);
    return {
      success: false,
      message: "Failed to send email",
      error: error.message,
    };
  }
};

module.exports = sendEmail;
