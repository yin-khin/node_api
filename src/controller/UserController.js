const User = require("../model/UserModel"); // Import the Sequelize model
const logError = require("../util/service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const TelegramBot = require("node-telegram-bot-api");
const nodemailer = require("nodemailer");
const IsValid = require("../util/prevent");
const sendEmail = require("../util/email");

// 1. Config Telegram Bot
const TOKEN = "8243066577:AAH7fw9vaiH4An9X2XwxNxGQkWwGydVEfa0";
// const bot = new TelegramBot(TOKEN, { polling: true });

// 2. Config JWT Secret
const TOKEN_SECRET = "SJDHFKJSDFjshsdhKJ%(*%#74y35";

// 3. Config Nodemailer Transporter
// const mailer = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "kspacelite1999@gmail.com",
//     pass: "rodprtbrnubnogba", // Ensure this is a 16-character App Password
//   },
// });

// 4. In-memory OTP store (Use Redis for production)
const otpStore = {};

// --- USER MANAGEMENT CONTROLLERS ---

// GET ALL USERS
const Get = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["user_id", "username", "email", "status"],
    });
    res.json({
      message: "Get users successfully",
      total: users.length,
      list: users,
    });
  } catch (err) {
    logError("User", err, res);
  }
};

// GET USER BY ID
const GetOne = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await User.findByPk(id, {
      attributes: ["user_id", "username", "email", "status"],
    });
    res.json({
      message: "Get user by ID successfully",
      user: userData || {},
    });
  } catch (err) {
    logError("User", err, res);
  }
};

// CREATE USER (REGISTER)
const Create = async (req, res) => {
  try {
    const { username, password, email, status } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        error: true,
        message: "Email, username and password are required",
      });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPass,
      email,
      status: status || "active",
    });

    res.json({
      message: "Create user successfully",
      user_id: newUser.user_id,
      success: true,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: true,
        message: "Email already exists",
      });
    }
    logError("User", err, res);
  }
};

// LOGIN WITH EMAIL AND PASSWORD
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email and password are required",
//         isLogin: false,
//       });
//     }

//     const userData = await User.findOne({ where: { email } });

//     if (!userData) {
//       return res.status(401).json({
//         message: "User not found",
//         isLogin: false,
//       });
//     }

//     const comparePassword = await bcrypt.compare(password, userData.password);

//     if (comparePassword) {
//       const token = jwt.sign(
//         {
//           user_id: userData.user_id,
//           email: userData.email,
//           username: userData.username,
//         },
//         TOKEN_SECRET,
//         { expiresIn: "1h" },
//       );

//       res.json({
//         message: "Login successful",
//         token: token,
//         isLogin: true,
//         user: {
//           user_id: userData.user_id,
//           username: userData.username,
//           email: userData.email,
//           status: userData.status,
//         },
//       });
//     } else {
//       res.status(401).json({
//         message: "Invalid password",
//         isLogin: false,
//       });
//     }
//   } catch (err) {
//     logError("User", err, res);
//   }
// };
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("BODY:", req.body);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        isLogin: false,
      });
    }

    const userData = await User.findOne({ where: { email } });

    console.log("USER:", userData);

    if (!userData) {
      return res.status(401).json({
        message: "User not found",
        isLogin: false,
      });
    }

    if (!userData.password) {
      console.error("❌ Password field missing in DB");
      return res.status(500).json({
        message: "Server error: password missing",
      });
    }

    const comparePassword = await bcrypt.compare(password, userData.password);

    if (!comparePassword) {
      return res.status(401).json({
        message: "Invalid password",
        isLogin: false,
      });
    }

    const token = jwt.sign(
      {
        user_id: userData.user_id,
        email: userData.email,
        username: userData.username,
      },
      TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      isLogin: true,
    });

  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err); // 👈 THIS IS KEY
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
// UPDATE USER
const Update = async (req, res) => {
  try {
    const { user_id, username, password, email, status } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ error: true, message: "user_id is required" });
    }

    const updateData = { username, email, status };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const [updatedCount] = await User.update(updateData, {
      where: { user_id },
    });

    res.json({
      message: updatedCount > 0 ? "Update user successfully" : "User not found",
    });
  } catch (err) {
    logError("User", err, res);
  }
};

// DELETE USER
const Delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await User.destroy({
      where: { user_id: id },
    });

    res.json({
      message: deletedCount > 0 ? "Delete user successfully" : "User not found",
    });
  } catch (err) {
    logError("User", err, res);
  }
};

// --- FORGOT PASSWORD / OTP FLOW ---

// SEND OTP
// const sendOTP = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const userData = await User.findOne({ where: { email } });

//     if (!userData) {
//       return res
//         .status(404)
//         .json({ message: "Email not found", success: false });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const transporter = nodemailer.createTransport({
//       service:"gmail",
//       auth:{

//       }
//     })
//   } catch (err) {
//     console.error("OTP Error:", err);
//     res.status(500).json({ message: "Failed to send OTP", success: false });
//   }
// };

// SEND OTP
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // check email exists
    const userData = await User.findOne({ where: { email } });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    // generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // hash OTP (security)
    const hashedOTP = await bcrypt.hash(otp, 10);

    // save OTP in DB
    await userData.update({
      otp: hashedOTP,
      otp_expire: new Date(Date.now() + 10 * 60 * 1000), // 1 minute
    });

    // create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

   const mailOptions = {
  from: `"Stock App" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "🔐 Your OTP Code - Stock App",
  html: `
  <div style="
    font-family: Arial, sans-serif;
    background-color: #f4f6f8;
    padding: 30px;
  ">
    <div style="
      max-width: 500px;
      margin: auto;
      background: #ffffff;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      text-align: center;
    ">
      
      <h2 style="color: #333; margin-bottom: 10px;">
        🔐 OTP Verification
      </h2>

      <p style="color: #555; font-size: 15px;">
        Use the OTP below to complete your verification.
      </p>

      <div style="
        margin: 20px 0;
        padding: 15px;
        background: #f1f5ff;
        border-radius: 8px;
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 5px;
        color: #2d5bff;
      ">
        ${otp}
      </div>

      <p style="color: #777; font-size: 14px;">
        This OTP will expire in <strong>1 minute</strong>.
      </p>

      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />

      <p style="color: #999; font-size: 12px;">
        If you did not request this, please ignore this email.
      </p>

      <p style="color: #999; font-size: 12px;">
        © ${new Date().getFullYear()} Stock App. All rights reserved.
      </p>

    </div>
  </div>
  `,
};
    // send email
    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("OTP Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// VERIFY OTP
// const verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     if (
//       !otpStore[email] ||
//       otpStore[email].otp !== otp ||
//       otpStore[email].expiresAt < Date.now()
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Invalid or expired OTP", success: false });
//     }
//     res.json({ message: "OTP verified successfully", success: true });
//   } catch (err) {
//     logError("User", err, res);
//   }
// };
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.otp) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this email",
      });
    }

    // Check if OTP expired
    if (Date.now() > new Date(user.otp_expire)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(String(otp), user.otp);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// RESET PASSWORD
// const resetPassword = async (req, res) => {
//   try {
//     const { email, otp, newPassword } = req.body;
//     if (!otpStore[email] || otpStore[email].otp !== otp) {
//       return res
//         .status(400)
//         .json({ message: "Invalid OTP session", success: false });
//     }
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     await User.update({ password: hashedPassword }, { where: { email } });
//     delete otpStore[email];
//     res.json({ message: "Password reset successfully", success: true });
//   } catch (err) {
//     logError("User", err, res);
//   }

// };
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.otp || Date.now() > new Date(user.otp_expire)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(String(otp), user.otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Update password and clear OTP
    await user.update({
      password: await bcrypt.hash(newPassword, 10),
      otp: null,
      otp_expire: null,
    });

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// --- EXTERNAL SERVICES ---

// SEND TELEGRAM MESSAGE
// const SendTelegramMessage = async (req, res) => {
//   try {
//     const { chat_id, image } = req.body;
//     bot.sendPhoto(chat_id, image, {
//       caption: "*The Company SHDD*\nProduct for sale",
//       parse_mode: "Markdown",
//     });
//     res.json({ message: "Message sent successfully" });
//   } catch (err) {
//     logError("Telegram", err, res);
//   }
// };

// // SEND TEST EMAIL
// const SendEmail = async (req, res) => {
//   try {
//     const mailOptions = {
//       from: "kspacelite1999@gmail.com",
//       to: "kspacelite1999@gmail.com",
//       subject: "Test Email",
//       text: "Hello from your application!",
//     };
//     await mailer.sendMail(mailOptions);
//     res.json({ message: "Email sent successfully" });
//   } catch (err) {
//     logError("Email", err, res);
//   }
// };


// POST /api/email/send
const SendEmail = async (req, res) => {
  try {
    // 1) Get data from body (allow dynamic email)
    const { to, subject, html, text } = req.body;

    // 2) Validate
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        message: "to, subject, and (html or text) are required",
      });
    }

    // (optional) simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 3) Send email
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
    });

    // 4) Handle result from util
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || "Failed to send email",
        error: result.error || null,
      });
    }

    // 5) OK
    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        to,
        subject,
        messageId: result.messageId,
      },
    });
  } catch (err) {
    console.error("SendEmail error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


module.exports = {
  Get,
  GetOne,
  Create,
  Update,
  Delete,
  login,
  // SendTelegramMessage,
  // SendEmail,
  SendEmail,
  sendOTP,
  resetPassword,
  verifyOtp,
};
