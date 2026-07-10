const cron = require("node-cron");
const Product = require("./models/product");
const checkStock = require("./services/checkStock");
const sendEmail = require("./services/sendEmail");
const Pincode = require("./models/Pincode");

cron.schedule("*2 * * * *", async () => {
  console.log("🔄 Running stock check...");

  try {
    const products = await Product.find();

    for (const product of products) {
      // User ke saare pincodes nikal kar pass karenge
      const pincodesDocs = await Pincode.find({ user: product.user });
    
      // Browser ab stock ke saath-saath pincodes bhi evaluate karega
      const result = await checkStock(product, pincodesDocs);

      // 🚨 FLIPKART RESTRICTED LOGISTICS ALERT TRIGGER
      if (
        product.store && 
        product.store.toLowerCase().includes("flipkart") && 
        result.availablePincodes?.length > 0 && 
        result.unavailablePincodes?.length > 0
      ) {
        await sendEmail(
          process.env.EMAIL_USER,
          "🚨 Flipkart Restricted Stock Alert!",
          `
          <div style="font-family:Arial,sans-serif; padding:20px; background:#0f172a; color:#f1f5f9; border-radius:10px;">
            <h2 style="color:#38bdf8; margin-top:0;">Target Stock Detected but Region-Restricted!</h2>
            <p><b>Product:</b> ${product.name}</p>
            <p><b>Price:</b> ₹${result.price || product.price}</p>
            <hr style="border-color:rgba(255,255,255,0.08);"/>
            <h3 style="color:#4ade80;">🟢 Available on these Pincodes:</h3>
            <p style="font-family:monospace; background:rgba(255,255,255,0.05); padding:10px; border-radius:5px;">${result.availablePincodes.join(", ")}</p>
            <h3 style="color:#f87171;">❌ Delivery Blocked on these Pincodes:</h3>
            <p style="font-family:monospace; background:rgba(255,255,255,0.05); padding:10px; border-radius:5px;">${result.unavailablePincodes.join(", ")}</p>
            <br>
            <a href="${product.url}" target="_blank" style="background:#38bdf8; color:#0f172a; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">🛒 Open Flipkart Link</a>
          </div>
          `
        );
        console.log(`✉️ Pincode specific email dispatched for: ${product.name}`);
      }

      // 💰 Price Change Alert
      if (product.price && result.price && product.price !== result.price) {
        await sendEmail(
          process.env.EMAIL_USER,
          "💰 Price Changed!",
          `
          <div style="font-family:Arial,sans-serif;padding:20px">
            <h2>💰 Price Changed!</h2>
            <h3>${product.name}</h3>
            <p><b>Old Price:</b> <del>₹${product.price}</del></p>
            <p><b>New Price:</b> <span style="color:green;font-size:20px;">₹${result.price}</span></p>
            <br>
            <a href="${product.url}" style="background:#2874F0;color:white;padding:12px 25px;text-decoration:none;border-radius:6px;font-weight:bold;">🛒 Buy Now</a>
          </div>
          `
        );
        console.log("💰 Price Changed");
      }

      // 🎉 Back In Stock Alert
      if (!product.inStock && result.inStock) {
        await sendEmail(
          process.env.EMAIL_USER,
          "🎉 Product Back In Stock!",
          `
          <div style="font-family:Arial,sans-serif;padding:20px">
            <h2>🎉 Product Back In Stock!</h2>
            <h3>${product.name}</h3>
            <p><b>Current Price:</b> ₹${result.price}</p>
            <br>
            <a href="${product.url}" style="background:#2874F0;color:white;padding:12px 25px;text-decoration:none;border-radius:6px;font-weight:bold;">🛒 Buy Now</a>
          </div>
          `
        );
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