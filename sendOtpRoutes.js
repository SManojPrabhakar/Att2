const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

// In-memory OTP store
const otpStore = {};

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.Email,
    pass:process.env.Pass // App password
  }
});

// OTP generator
const generateRandomOTP = () => {
  const digits = '0123456789';
  return Array.from({ length: 6 }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
};

// Normalize email utility
const normalizeEmail = (email) => email?.trim().toLowerCase();

// Send OTP email
const sendOtpEmail = async (userEmail, otp) => {
  const mailOptions = {
    from: process.env.Email,
    to: userEmail,
    subject: 'Your Attendance2Day OTP Code',
    text: `Hello,

Your One-Time Password (OTP) is: ${otp}

Please use this code to verify your identity. It will expire in 1 hour.

If you did not request this, please ignore this email.

– Attendance2Day Team`
  };

  return transporter.sendMail(mailOptions);
};

// ===== /send-otp =====
router.post('/send-otp', async (req, res) => {
  const rawEmail = req.body.Email;
  const userEmail = normalizeEmail(rawEmail);


  if (!userEmail || !validator.isEmail(userEmail)) {
    return res.status(400).json({ success: false, error: 'Invalid or missing email address.' });
  }

  const otp = generateRandomOTP();
  const expiresAt = Date.now() + 60 * 60 * 1000;
  otpStore[userEmail] = { otp, expiresAt };

  try {
    const result = await sendOtpEmail(userEmail, otp);
 
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again later.' });
  }
});

// ===== /verify-otp =====
router.post('/verify-otp', (req, res) => {
  const { Email, otp: enteredOTP } = req.body;
  const normalizedEmail = normalizeEmail(Email);

  if (!normalizedEmail || !enteredOTP) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
  }

  const record = otpStore[normalizedEmail];
 
  if (!record) {
    return res.status(400).json({ success: false, error: 'No OTP found or expired for this email.' });
  }

  const { otp, expiresAt } = record;

  if (Date.now() > expiresAt) {
    delete otpStore[normalizedEmail];
    return res.status(400).json({ success: false, error: 'OTP has expired.' });
  }

  if (enteredOTP === otp) {
    delete otpStore[normalizedEmail];
    
    return res.status(200).json({ success: true, message: 'OTP verification successful' });
  }

  return res.status(400).json({ success: false, error: 'Invalid OTP' });
});

// ===== /send-otp/coll (with JWT) =====
router.post('/send-otp/coll', async (req, res) => {
  const token = req.cookies.att2day;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: Token is required." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: error.name === "TokenExpiredError" ? "Token has expired" : "Invalid token"
    });
  }

  const rawEmail = req.body.Email;
  const userEmail = normalizeEmail(rawEmail);
  

  if (!userEmail || !validator.isEmail(userEmail)) {
    return res.status(400).json({ success: false, error: 'Invalid or missing email address.' });
  }

  const otp = generateRandomOTP();
  const expiresAt = Date.now() + 60 * 60 * 1000;
  otpStore[userEmail] = { otp, expiresAt };

  try {
    const result = await sendOtpEmail(userEmail, otp);
    
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {

    res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again later.' });
  }
});

// ===== /verify-otp/coll (with JWT) =====
router.post('/verify-otp/coll', async (req, res) => {
  const token = req.cookies.att2day;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: Token is required." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === "TokenExpiredError" ? "Token has expired" : "Invalid token"
    });
  }

  const { Email, otp: enteredOTP } = req.body;
  const normalizedEmail = normalizeEmail(Email);
  if (!normalizedEmail || !enteredOTP) {
    return res.status(400).json({ success: false, message: "Email and OTP are required." });
  }

  
  const record = otpStore[normalizedEmail];
  if (!record) {
    return res.status(400).json({ success: false, error: 'No OTP found or expired for this email.' });
  }

  const { otp, expiresAt } = record;
  if (Date.now() > expiresAt) {
    delete otpStore[normalizedEmail];
    return res.status(400).json({ success: false, error: 'OTP has expired.' });
  }

  if (enteredOTP === otp) {
  
    delete otpStore[normalizedEmail];
    return res.status(200).json({ success: true, message: 'OTP verification successful' });
  }

  return res.status(400).json({ success: false, error: 'Invalid OTP' });
});

module.exports = router;



