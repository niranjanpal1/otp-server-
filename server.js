require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "OTP Server is running"
  });
});

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email required"
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    });

    res.json({
      success: true,
      message: "OTP sent"
    });

  } catch (err) {
    console.error("Mail Error:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] === otp) {
    delete otpStore[email];

    return res.json({
      success: true,
      message: "OTP verified"
    });
  }

  res.status(400).json({
    success: false,
    message: "Invalid OTP"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("EMAIL:", process.env.EMAIL);
  console.log("APP_PASSWORD:", process.env.APP_PASSWORD ? "Loaded" : "Missing");
});
