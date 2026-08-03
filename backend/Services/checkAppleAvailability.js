const checkAppleStore = require("./checkApplestore");
const Pincode = require("../models/Pincode");
const sendTelegram = require("./sendTelegram"); // ⚠️ नीचे note देखो


async function checkAppleAvailability(product) {
  const userPincodes = await Pincode.find({ user: product.user });
  const pincodesToCheck = userPincodes.length > 0
    ? userPincodes.map((p) => p.pincode)
    : ["110017"]; 

  let inStock = false;
  let price = null;
  const availableEntries = [];
  const unavailableEntries = [];

  for (const pin of pincodesToCheck) {
    try {
      const result = await checkAppleStore({ url: product.url, pincode: pin });
      if (result.price) price = result.price;

      if (result.inStock) {
        inStock = true;
        for (const store of result.storeDetails || []) {
          // e.g. "110017 - Apple Saket: Available Today"
          availableEntries.push(`${pin} - ${store.storeName}: ${store.quote}`);
        }
      } else {
        unavailableEntries.push(pin);
      }
    } catch (err) {
      console.log(`Apple check failed for pincode ${pin}:`, err.message);
      unavailableEntries.push(pin);
    }
    await new Promise((r) => setTimeout(r,4000));
  }

  console.log(`\n📍 ${product.name} — Store Availability:`);
  if (availableEntries.length > 0) {
    availableEntries.forEach((entry) => console.log(`   ✅ ${entry}`));
  } else {
    console.log(`   ❌ Not available at any checked store`);
  }
  console.log("");

  const currentQuote = availableEntries.join(" | "); // e.g. "110017 - Saket: Available Tue 4 Aug"

  if (
    availableEntries.length > 0 &&
    product.notify &&
    currentQuote !== product.lastAppleQuote // pehli baar mila, YA date/store badla
  ) {
    try {
      const storeLines = availableEntries
        .map((entry) => {
          const afterDash = entry.split(" - ")[1] || entry;
          return `📍 ${afterDash}`;
        })
        .join("\n");

      await sendTelegram(
        `🍏 ${product.name} — In Stock!\n\n${storeLines}\n\n${product.url}`
      );
    } catch (err) {
      console.log("Telegram send failed:", err.message);
    }
  }

  return {
    inStock,
    price,
    availablePincodes: availableEntries,
    unavailablePincodes: unavailableEntries,
    lastAppleQuote: availableEntries.length > 0 ? currentQuote : null,
  };
}

module.exports = checkAppleAvailability;