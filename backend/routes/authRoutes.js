const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  verifyOTP,
  forgotPassword,
  resetPassword,
  resendOTP,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;