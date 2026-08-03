const puppeteer = require("puppeteer");
//const chromium = require("@sparticuz/chromium");
// old const checkAppleStore = require("./checkApplestore");
const checkAppleAvailability = require("./checkAppleAvailability");
const Pincode = require("../models/Pincode");

// Default pincode + stores used ONLY for Apple availability checks.
// Change these to whichever PIN code / stores you want to monitor.
//const APPLE_PINCODE = "110017";
//const APPLE_STORE_NAMES = ["Apple Saket", "Apple Noida"];

const checkStock = async (product) => {
  let browser;

  try {
    let inStock = true;
    console.log("1. Starting checkStock");

    console.log("2. Before browser launch");

browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
    console.log("3. Browser launched");

    const page = await browser.newPage();

    console.log("4. New page created");

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36"
    );

    console.log("5. Before page.goto:", product.url);
    page.setDefaultNavigationTimeout(30000);
console.log("opening", product.url);

await page.goto(product.url, {
  waitUntil: "domcontentloaded",
  timeout: 45000,
}).catch(e => console.log("Goto Error:", e.message));

console.log("After goto");

    console.log("6. Page loaded");
    console.log(await page.title());
await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("7. Body Loaded");

   const hostname = new URL(product.url).hostname;

console.log("Hostname:", hostname);
const title = await page.title();

const lowerHtml = await page.evaluate(() =>
  document.body.innerText.toLowerCase()
);


console.log(`Checking: ${product.name}`);

if (hostname.includes("amazon")) {
  console.log("Amazon detected");
  await page.waitForSelector("body", { timeout: 10000 });
  console.log("Amazon body loaded");
}

await new Promise(resolve => setTimeout(resolve, 2000));
    if (product.name === "Iphone 17 256") {
      await page.screenshot({
        path: "unicorn.png",
        fullPage: true,
      });
    }

    console.log(`Checking: ${product.name}`);

let price = product.price;

try {
  if (hostname.includes("flipkart")) {

    console.log("Before Flipkart $$eval");

const txt = await page.$eval(
  "div.v1zwn21l.v1zwn20._1psv1zeb9._1psv1ze0",
  el => el.innerText.trim()
).catch(() => null);

console.log("Price Text:", txt);

if (txt) {
  price = Number(txt.replace(/[₹,]/g, ""));
}

console.log("Flipkart Price:", price);
  }

 else if (hostname.includes("amazon")) {
    // JSON-LD (schema.org Product data) Amazon khud embed karta hai — ye
    // hamesha SAHI product ka price deta hai, kabhi sponsored/related item
    // ka nahi. Isliye pehle isi ko try karo, phir DOM selectors fallback me.
    const jsonLdPrice = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item.offers) {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offer && offer.price) return Number(offer.price);
            }
          }
        } catch (e) {}
      }
      return null;
    });

    console.log("Amazon JSON-LD Price:", jsonLdPrice);

    if (jsonLdPrice && jsonLdPrice > 100) {
      price = jsonLdPrice;
    } else {
      
      const amazonPriceSelectors = [
        "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
        "#corePrice_feature_div .a-price .a-offscreen",
        "#apex_desktop .a-price .a-offscreen",
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        ".a-price .a-offscreen",
      ];

      const whole = await page.evaluate((selectors) => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.innerText && el.innerText.trim()) {
            return el.innerText.trim();
          }
        }
        return null;
      }, amazonPriceSelectors);

      console.log("Amazon Price Text (fallback):", whole);

      if (whole) {
        price = Number(whole.replace(/[₹,]/g, ""));
      }
    }
  }

  else if (hostname.includes("shop.unicornstore.in")) {
  const txt = await page.$eval(
  ".price-box .price.ml-2",
  el => el.innerText
).catch(() => null);

console.log("Unicorn Price:", txt);

if (txt) {
  price = parseFloat(txt.replace(/[^0-9.]/g, ""));
}
console.log("Unicorn Price:", price);
//console.log(await page.content());
  }

  else if (hostname.includes("croma")) {
    const txt = await page.$eval(
      ".amount",
      el => el.innerText
    ).catch(() => null);

    if (txt) {
      price = parseFloat(txt.replace(/[^0-9.]/g, ""));
    }
  }

  console.log("Current Price:", price);

} catch (e) {
  console.log(e);
  console.log("Price Fetch Failed");
}
  /*let appleResult = null;
  if (hostname.includes("apple.in") || hostname.includes("apple.com")) {
    console.log("Apple Store detected");
    try {
      // Pass pincode + target stores so we get real per-store availability
      // (e.g. Apple Saket / Apple Noida) instead of a generic yes/no.
      appleResult = await checkAppleStore({
        url: product.url,
        pincode: APPLE_PINCODE,
        storeNames: APPLE_STORE_NAMES,
      });
      inStock = appleResult.inStock;
      if (appleResult.price) {
        price = appleResult.price;
      }
      console.log("Apple Store Result:", appleResult);
    } catch (err) {
      console.log("Apple Check Error inside stock script:", err.message);
    }
  }
  */
 let appleResult = null;
if (hostname.includes("apple.in") || hostname.includes("apple.com")) {
  console.log("Apple Store detected");
  try {
    // User ne jo bhi pincodes save kiye hain unn SABKE liye check karta hai
    appleResult = await checkAppleAvailability(product);
    inStock = appleResult.inStock;
    if (appleResult.price) {
      price = appleResult.price;
    }
    console.log("Apple Store Result:", appleResult);
  } catch (err) {
    console.log("Apple Check Error inside stock script:", err.message);
  }
  await new Promise((r) => setTimeout(r, 15000));
}

    console.log("Website:", hostname);
    console.log("Page Title:", title);
    console.log("URL:", product.url);

    if (product.name === "Ps 5 Console") {
      console.log(
        "Contains 'out of stock':",
        lowerHtml.includes("out of stock")
      );
      console.log(
        "Contains 'sold out':",
        lowerHtml.includes("sold out")
      );
      console.log(
        "Contains 'notify me':",
        lowerHtml.includes("notify me")
      );
      console.log(
        "Contains 'currently unavailable':",
        lowerHtml.includes("currently unavailable")
      );
    }

    //let inStock = true;

    if (
      lowerHtml.includes("notify me") ||
      lowerHtml.includes("sold out") ||
      lowerHtml.includes("out of stock") ||
      lowerHtml.includes("currently unavailable")
    ) {
      inStock = false;
    }

    if (hostname.includes("flipkart")) {
      inStock = !lowerHtml.includes("notify me");
    } else if (hostname.includes("shop.unicornstore.in")) {
      const pageText = await page.evaluate(() =>
        document.body.innerText.toLowerCase()
      );

      const hasInStock = pageText.includes("in stock");
      const hasNotifyMe = pageText.includes("notify me");

      inStock = hasInStock && !hasNotifyMe;

      console.log("Has IN STOCK:", hasInStock);
      console.log("Has Notify Me:", hasNotifyMe);
    } 
        else if (hostname.includes("croma"))
          {
          const pageText = await page.evaluate(() =>
          document.body.innerText.toLowerCase()
        );
        inStock = 
        !pageText.includes("out of stock") &&
        !pageText.includes("notify me") &&
        !pageText.includes("currently unavailable");
        console.log("croma Stock:", inStock);
  
} else if (hostname.includes("amazon")) {
  const pageText = await page.evaluate(() =>
    document.body.innerText.toLowerCase()
  );

  const hasBuyNow = pageText.includes("buy now");
  const hasAddToCart = pageText.includes("add to cart");
  const unavailable = pageText.includes("currently unavailable");

  inStock = (hasBuyNow || hasAddToCart) && !unavailable;

  console.log("Amazon Buy Now:", hasBuyNow);
  console.log("Amazon Add To Cart:", hasAddToCart);
  console.log("Amazon Unavailable:", unavailable);
  if (!inStock) {
    price = product.price;
  }
    }

    console.log("Detected In Stock:", inStock);

    await browser.close();

    return {
      inStock,
      price,
      availablePincodes: appleResult?.availablePincodes || [],
      unavailablePincodes: appleResult?.unavailablePincodes || [],
      storeMessage: appleResult?.storeMessage || null,
      partNumber: appleResult?.partNumber || null,
      storeDetails: appleResult?.storeDetails || [],
      //pincodeUsed: appleResult ? APPLE_PINCODE : null,
      pincodeUsed: appleResult?.availablePincodes?.length ? "multiple" : null,
      lastAppleQuote: appleResult?.lastAppleQuote ?? product.lastAppleQuote,
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    console.log("Stock Check Error:", error.message);

    return {
      inStock: product.inStock,
      price: product.price,
    };
  }
};
module.exports = checkStock;