const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // your group's chat id

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing in .env — skipping Telegram alert.");
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true, // no big thumbnail/description card, just the clickable link text
    });
    console.log("✅ Telegram message sent");
  } catch (error) {
    console.error("❌ Telegram send error:", error.response?.data || error.message);
  }
}

module.exports = sendTelegram;