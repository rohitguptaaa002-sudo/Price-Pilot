require("dotenv").config();

const connectDB = require("./config/db");
const cors = require("cors");
const express = require("express");
const Product = require("./models/product");
const checkStock = require("./Services/checkStock");
require("./cron");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const Pincode = require("./models/Pincode");

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

connectDB();

// ==========================================================================
// Generic error responder — never leak internal error.message / stack to
// the client. Full details are still logged server-side for debugging.
// ==========================================================================
function sendServerError(res, error, context) {
  console.error(`❌ [${context}]`, error);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
}

// ==========================================================================
// 🕵️‍♂️ FLIPKART PINCODE RADAR SCRAPER FUNCTION
// ==========================================================================
async function yourFlipkartPincodeScraper(productUrl, pincode) {
  try {
    const axios = require("axios");
    const response = await axios.get(productUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": `pincode=${pincode}; SN=pincode=${pincode};`
      },
      timeout: 10000
    });

    const htmlContent = response.data;

    if (
      htmlContent.includes("Not Deliverable") ||
      htmlContent.includes("does not deliver to") ||
      htmlContent.includes("Cannot deliver to this pincode")
    ) {
      return false;
    }
    return true;

  } catch (error) {
    console.error(`🚨 Error scanning pincode ${pincode}:`, error.message);
    return false;
  }
}

// ==========================================================================
// BASE ROUTES
// ==========================================================================
app.get("/", (req, res) => {
  res.send("🚀 StockRadar Backend is Running");
});

app.get("/about", (req, res) => {
  res.send("Welcome to StockRadar");
});

// ==========================================================================
// PRODUCT MANAGEMENT ROUTES
// ==========================================================================

// Add Product
app.post("/products", authMiddleware, async (req, res) => {
  try {
    const productCount = await Product.countDocuments({
      user: req.user.id,
    });

    if (productCount >= 40) {
      return res.status(400).json({
        success: false,
        message: "Maximum 40 products allowed.",
      });
    }

    const product = await Product.create({
      ...req.body,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Product Saved Successfully",
      product,
    });
  } catch (error) {
    sendServerError(res, error, "POST /products");
  }
});

// Get Products
app.get("/products", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id });
    res.json(products);
  } catch (error) {
    sendServerError(res, error, "GET /products");
  }
});

// Update Product
app.put("/products/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: "Product Not Found" });
    }
    res.json({ success: true, message: "Product Updated Successfully", product });
  } catch (error) {
    sendServerError(res, error, "PUT /products/:id");
  }
});

// Delete Product
app.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product Not Found" });
    }
    res.json({ success: true, message: "Product Deleted Successfully" });
  } catch (error) {
    sendServerError(res, error, "DELETE /products/:id");
  }
});

// Lost Signal Route
app.put("/products/:id/lost-signal", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: "Out of Range" },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: "Product Not Found" });
    }
    res.json({ success: true, message: "Status updated to Out of Range", product });
  } catch (error) {
    sendServerError(res, error, "PUT /products/:id/lost-signal");
  }
});

// ==========================================================================
// PINCODE MANAGEMENT ROUTES
// ==========================================================================

// Add Pincode
app.post("/pincodes", authMiddleware, async (req, res) => {
  try {
    const { pincode } = req.body;
    if (!pincode) {
      return res.status(400).json({ success: false, message: "Pincode is required" });
    }

    const count = await Pincode.countDocuments({ user: req.user.id });
    if (count >= 50) {
      return res.status(400).json({ success: false, message: "Maximum 50 pincodes allowed." });
    }

    const exists = await Pincode.findOne({ user: req.user.id, pincode });
    if (exists) {
      return res.status(400).json({ success: false, message: "Pincode already added." });
    }

    const newPincode = await Pincode.create({ pincode, user: req.user.id });
    res.status(201).json({ success: true, message: "Pincode added successfully", pincode: newPincode });
  } catch (error) {
    sendServerError(res, error, "POST /pincodes");
  }
});

// Get Pincodes
app.get("/pincodes", authMiddleware, async (req, res) => {
  try {
    const pincodes = await Pincode.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(pincodes);
  } catch (error) {
    sendServerError(res, error, "GET /pincodes");
  }
});

// Delete Pincode
app.delete("/pincodes/:id", authMiddleware, async (req, res) => {
  try {
    const pincode = await Pincode.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!pincode) {
      return res.status(404).json({ success: false, message: "Pincode not found" });
    }
    res.json({ success: true, message: "Pincode deleted successfully" });
  } catch (error) {
    sendServerError(res, error, "DELETE /pincodes/:id");
  }
});

// ==========================================================================
// CRON / STOCK CHECK RADAR ROUTE
// ==========================================================================

app.post("/api/products/check-stock", async (req, res) => {
  try {
    const products = await Product.find();
    const nodemailer = require("nodemailer");

    for (const product of products) {
      // 1. Reset Status
      await Product.findByIdAndUpdate(product._id, { status: "Ready to Hunt" });

      const result = await checkStock(product);

      // 2. Data Sanitization (Price check)
      const cleanPrice = (result.price && !isNaN(result.price)) ? result.price : (product.price || 0);

      let updateData = {
        inStock: result.inStock,
        price: cleanPrice,
        status: result.inStock ? "Ready to Hunt" : "Out of Stock",
        lastAppleQuote: result.lastAppleQuote ?? product.lastAppleQuote,
      };

      // 3. Flipkart Logic
      if (product.store && product.store.toLowerCase().includes("flipkart") && result.inStock) {
        const userPincodes = await Pincode.find({ user: product.user });
        const pincodeList = userPincodes.map((p) => p.pincode);

        if (pincodeList.length > 0) {
          let availablePincodes = [];
          let unavailablePincodes = [];

          for (const pin of pincodeList) {
            try {
              const isDeliverable = await yourFlipkartPincodeScraper(product.url, pin);
              if (isDeliverable) availablePincodes.push(pin);
              else unavailablePincodes.push(pin);
            } catch (err) {
              unavailablePincodes.push(pin);
            }
          }

          updateData.availablePincodes = availablePincodes;
          updateData.unavailablePincodes = unavailablePincodes;

          // Mail Trigger
          if (availablePincodes.length > 0 && unavailablePincodes.length > 0) {
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
            });

            const mailOptions = {
              from: `"⚡ Price Pilot Radar" <${process.env.EMAIL_USER}>`,
              to: process.env.ALERT_RECEIVER_EMAIL,
              subject: `🚨 Flipkart Delivery Alert: ${product.name}`,
              html: `
                <div style="background:#0f172a; color:#f1f5f9; padding:20px; font-family:sans-serif; border-radius:10px;">
                  <h2 style="color:#38bdf8;">🎯 Target Stock Detected but Region-Restricted!</h2>
                  <p><strong>Product:</strong> ${product.name}</p>
                  <p><strong>Price:</strong> ₹${product.price}</p>
                  <hr style="border-color:rgba(255,255,255,0.08);"/>
                  <h3 style="color:#4ade80;">🟢 Available on these Pincodes (${availablePincodes.length}):</h3>
                  <p style="font-family:monospace; background:rgba(255,255,255,0.05); padding:10px; border-radius:5px;">${availablePincodes.join(", ")}</p>
                  <h3 style="color:#f87171;">❌ Delivery Blocked on these Pincodes (${unavailablePincodes.length}):</h3>
                  <p style="font-family:monospace; background:rgba(255,255,255,0.05); padding:10px; border-radius:5px;">${unavailablePincodes.join(", ")}</p>
                  <br/>
                  <a href="${product.url}" target="_blank" style="background:#38bdf8; color:#0f172a; padding:12px 20px; text-decoration:none; font-weight:bold; border-radius:6px; display:inline-block;">Open Flipkart Link</a>
                </div>
              `
            };

            try {
              await transporter.sendMail(mailOptions);
              console.log(`✉️ Flipkart Radar alert email sent for: ${product.name}`);
            } catch (mailErr) {
              console.error(`❌ Failed to send alert email for ${product.name}:`, mailErr.message);
            }
          }
        }
      } else {
        updateData.availablePincodes = [];
        updateData.unavailablePincodes = [];
      }

      // 4. Update Database
      try {
        await Product.findByIdAndUpdate(product._id, { $set: updateData }, { runValidators: true });
        console.log(`✅ Success updated: ${product.name}`);
      } catch (err) {
        console.error(`❌ Mongoose Update FAILED for ${product.name}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: "Stock check completed",
    });
  } catch (error) {
    sendServerError(res, error, "POST /api/products/check-stock");
  }
});

// ==========================================================================
// 404 + FALLBACK ERROR HANDLERS
// ==========================================================================

// Unknown route
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

// Catch-all error handler (in case something throws outside a try/catch)
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;