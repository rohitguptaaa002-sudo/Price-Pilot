const sendEmail = require("./sendEmail");

const sendOTPEmail = async (email, otp) => {
  const subject = "StockRadar - Email Verification OTP";

  const text = `Your StockRadar OTP is: ${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.`;

  await sendEmail(email, subject, text);
};

module.exports = sendOTPEmail;