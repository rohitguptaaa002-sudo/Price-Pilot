const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const checkStock = async (product) => {
  let browser;

  try {
    console.log("1. Starting checkStock");

    console.log("2. Before browser launch");

browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [
    ...chromium.args,
    "--no-sandbox",
    "--disable-setuid-sandbox"
  ],
  headless: true,
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
    const whole = await page.$eval(
  ".a-price .a-offscreen",
      el => el.innerText
    ).catch(() => null);

    if (whole) {
      price = Number(whole.replace(/[₹,]/g, ""));
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

    let inStock = true;

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
      // Amazon normal stock check only
    }

    console.log("Detected In Stock:", inStock);

    await browser.close();

    return {
      inStock,
      price,
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