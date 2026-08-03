const cron = require("node-cron");
const Product = require("./models/product");
const checkStock = require("./Services/checkStock");
const sendTelegram = require("./Services/sendTelegram");
const Pincode = require("./models/Pincode");

cron.schedule("*/5 * * * *", async () => {
  console.log("🔄 Running stock check...");

  try {
    const products = await Product.find();

    for (const product of products) {
      
      const pincodesDocs = await Pincode.find({ user: product.user });
    
      
      const result = await checkStock(product, pincodesDocs);

      // 🚨 FLIPKART RESTRICTED LOGISTICS ALERT TRIGGER
      if (
        product.store && 
        product.store.toLowerCase().includes("flipkart") && 
        result.availablePincodes?.length > 0 && 
        result.unavailablePincodes?.length > 0
      ) {
        await sendTelegram(
          `🚨 <b>Flipkart Restricted Stock Alert!</b>\n\n` +
          `<b>Product:</b> ${product.name}\n` +
          `<b>Price:</b> ₹${result.price || product.price}\n\n` +
          `🟢 <b>Available on:</b>\n<code>${result.availablePincodes.join(", ")}</code>\n\n` +
          `❌ <b>Blocked on:</b>\n<code>${result.unavailablePincodes.join(", ")}</code>\n\n` +
          `🛒 <a href="${product.url}">Open Flipkart Link</a>`
        );
        console.log(`✉️ Telegram alert sent (restricted pincodes) for: ${product.name}`);
      }

      // 💰 Price Change Alert
      if (product.price && result.price && product.price !== result.price) {
        await sendTelegram(
          `💰 <b>Price Changed!</b>\n\n` +
          `<b>${product.name}</b>\n` +
          `Store: <b>${product.store}</b>\n` +
          `Old Price: <s>₹${product.price}</s>\n` +
          `New Price: <b>₹${result.price}</b>\n\n` +
          `🛒 <a href="${product.url}">Buy Now</a>`
        );
        console.log("💰 Price Changed");
      }

      // 🎉 Back In Stock Alert
      if (!product.inStock && result.inStock) {
        const isApple = product.url && product.url.toLowerCase().includes("apple.com");

        if (isApple && result.storeDetails?.length > 0) {
          // 🍏 Rich Apple-specific alert: pincode, per-store availability, part number
          const storeLines = result.storeDetails
            .map((s) => `🏪 <b>${s.storeName}</b>, ${s.city}${s.storeNumber ? ` (${s.storeNumber})` : ""}\n   ${s.quote}`)
            .join("\n\n");

          await sendTelegram(
            `🚨 <b>APPLE STOCK ALERT</b> 🚨\n` +
            `📦 <b>${product.name}</b>\n\n` +
            `📍 Pincode: <b>${result.pincodeUsed || "-"}</b>\n\n` +
            `${storeLines}\n\n` +
            (result.partNumber ? `🔢 Part #: <code>${result.partNumber}</code>\n\n` : "") +
            `🔗 <a href="${product.url}">Buy Now</a>`
          );
          console.log(`🍏 Apple stock alert sent for: ${product.name}`);
        } else {
          await sendTelegram(
            `🎉 <b>Product Back In Stock!</b>\n\n` +
            `<b>${product.name}</b>\n` +
            `Store: <b>${product.store}</b>\n` +
            `Current Price: ₹${result.price}\n\n` +
            `🛒 <a href="${product.url}">Buy Now</a>`
          );
        }
      }

      // Save everything cleanly to database
      await Product.findByIdAndUpdate(product._id, {
        inStock: result.inStock,
        lastPrice: product.price,
        price: result.price,
        availablePincodes: result.availablePincodes || [],
        unavailablePincodes: result.unavailablePincodes || []
      });

      console.log(`${product.name} → ${result.inStock ? "In Stock" : "Out of Stock"}`);
    }

    console.log("✅ Stock check completed");
  } catch (error) {
    console.error("Cron Error:", error.message);
  }
});