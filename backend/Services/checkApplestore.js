const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

async function checkAppleStore(productOrUrl) {
  let browser;
  const isObj = typeof productOrUrl === "object";
  let rawUrl = isObj ? productOrUrl.url : productOrUrl;
  const pincode = isObj ? productOrUrl.pincode : null;
  const storeNames = isObj && productOrUrl.storeNames ? productOrUrl.storeNames : null;
  const productUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  try {
    console.log(`🍏 Checking Apple Store (API/DOM Hybrid): ${productUrl}`);

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 900 });

    let apiStoreData = null;
    let capturedFulfillmentUrl = null;
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("fulfillment-messages") || url.includes("as-availability") || url.includes("pickup-message")) {
        console.log("DEBUG: fulfillment-related REQUEST URL:", url);
        // Only keep URLs that include the product SKU (parts.0=...) — Apple's
        // page also fires a simpler, SKU-less request that must NOT overwrite
        // the useful one, or the store lookup fails with "Product(s) Invalid".
        if (url.includes("parts.0=") && !capturedFulfillmentUrl) {
          capturedFulfillmentUrl = url;
        }
      }
      req.continue();
    });
    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("fulfillment-messages") || url.includes("as-availability") || url.includes("pickup-message")) {
        try {
          const json = await res.json();
          console.log("DEBUG: fulfillment-related RESPONSE top-level keys:", json ? Object.keys(json) : null);
          if (json && json.body) {
            apiStoreData = json;
          } else if (json) {
            console.log("DEBUG: response JSON (no .body field), full snippet:", JSON.stringify(json).slice(0, 500));
          }
        } catch (e) {
          console.log("DEBUG: fulfillment-related response was not JSON:", e.message);
        }
      }
    });

    await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 60000 });
    // Give any background fulfillment/availability call a moment to fire on its own
    await new Promise((r) => setTimeout(r, 3000));
    console.log("DEBUG: auto-captured fulfillment URL (if any):", capturedFulfillmentUrl);

    // --- 1. Price extraction (unchanged logic, minor cleanup) ---
    let price = null;
    try {
      price = await page.evaluate(() => {
        const elements = document.querySelectorAll("span, div, p");
        let prices = [];
        for (let el of elements) {
          if (el && el.innerText) {
            let text = el.innerText.trim();
            if (text.startsWith("₹") && !text.includes("/mo") && !text.includes("month") && text.length < 15) {
              let num = Number(text.replace(/[^0-9.]/g, ""));
              if (num >= 30000 && num <= 200000) prices.push(num);
            }
          }
        }
        return prices.length > 0 ? Math.min(...prices) : null;
      });
    } catch (err) {
      console.log("Price parse error:", err.message);
    }


    if (pincode && capturedFulfillmentUrl) {
      try {
        const client = await page.target().createCDPSession();
        await client.send("Network.clearBrowserCookies");
        await client.send("Network.clearBrowserCache");
        const urlObj = new URL(capturedFulfillmentUrl);
        urlObj.searchParams.set("location", pincode);
        const customUrl = urlObj.toString();
        console.log("DEBUG: custom fulfillment fetch URL:", customUrl);

        const doFetch = async () => {
          return page.evaluate(async (url) => {
            try {
              // Apni IP se seedha hit karne ki jagah, ek free public relay
              // Apple ko relay ki IP dikhegi, apni nahi
              const proxiedUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
              const res = await fetch(proxiedUrl, {
                headers: { Accept: "application/json" },
              });
              const text = await res.text();
              return { status: res.status, text };
            } catch (e) {
              return { error: e.message };
            }
          }, customUrl);
        };

        /*let fetchResult = await doFetch();
        let attempt = 1;
        while (fetchResult.status !== 200 && attempt < 3) {
          attempt++;
          console.log(
            `DEBUG: custom fetch attempt ${attempt - 1} failed with status`,
            fetchResult.status,
            `— retrying (${attempt}/3)...`
          );
          await new Promise((r) => setTimeout(r, attempt * 4000)); // 4s, then 6s
          fetchResult = await doFetch();
        }
          */
         let fetchResult = await doFetch();
        if (fetchResult.status !== 200) {
          console.log(`DEBUG: fetch failed with status ${fetchResult.status} — skipping retries this cycle`);
        }

        console.log("DEBUG: custom fetch status:", fetchResult.status, fetchResult.error || "");
        console.log("DEBUG: custom fetch text preview:", (fetchResult.text || "").slice(0, 300));

        if (fetchResult.text) {
          try {
            const parsed = JSON.parse(fetchResult.text);
            if (parsed && parsed.body) {
              apiStoreData = parsed;
              console.log("DEBUG: apiStoreData successfully set via custom fetch!");
              console.log(
                "DEBUG: pickupMessage structure:",
                JSON.stringify(parsed?.body?.content?.pickupMessage || {}).slice(0, 1500)
              );
            } else {
              console.log("DEBUG: custom fetch JSON had no .body field. Keys:", Object.keys(parsed || {}));
            }
          } catch (e) {
            console.log("DEBUG: custom fetch response was not valid JSON:", e.message);
          }
        }
      } catch (err) {
        console.log("Custom fetch error:", err.message);
      }
    } else {
      console.log("DEBUG: skipping custom fetch — pincode or capturedFulfillmentUrl missing", {
        pincode,
        capturedFulfillmentUrl,
      });
    }
    console.log("DEBUG: apiStoreData captured so far:", apiStoreData ? "YES" : "NO");

    // --- 3. Build result: prefer real API data, fall back to DOM text scan ---
    let inStock = false;
    let storeMessage = "Store pickup unavailable";
    let availableStores = [];
    let unavailableStores = [];

    if (apiStoreData) {
      try {
        const stores = apiStoreData?.body?.content?.pickupMessage?.stores || [];

        const parsedStores = stores.map((store) => {
          const partsAvailability = store.partsAvailability || {};
          const partNum = Object.keys(partsAvailability)[0] || null;
          const firstPart = partsAvailability[partNum] || {};
          const quote = firstPart.pickupSearchQuote || firstPart.pickupSearchQuoteConstrained || "No info";
          const actualProductTitle = firstPart.storePickupProductTitle || "Unknown";
          console.log(`DEBUG: Apple API says this SKU (${partNum}) is: "${actualProductTitle}"`);
          const available =
            firstPart.pickupDisplay !== "unavailable" && !/unavailable/i.test(quote);
          return {
            storeName: store.storeName,
            storeNumber: store.storeNumber,
            city: store.city,
            available,
            quote,
            date: quote,
            partNumber: partNum,
          };
        });

        // Apple's storeName is just "Saket", not "Apple Saket" — strip any
        // "Apple " prefix from our target names before comparing.
        const relevantStores = storeNames
          ? parsedStores.filter((s) =>
              storeNames.some((name) => {
                const cleanTarget = name.toLowerCase().replace(/^apple\s+/i, "").trim();
                const cleanStore = (s.storeName || "").toLowerCase().replace(/^apple\s+/i, "").trim();
                return cleanStore === cleanTarget || cleanStore.includes(cleanTarget) || cleanTarget.includes(cleanStore);
              })
            )
          : parsedStores;

        availableStores = relevantStores.filter((s) => s.available);
        unavailableStores = relevantStores.filter((s) => !s.available);

        inStock = availableStores.length > 0;
        storeMessage = availableStores.length > 0
          ? availableStores.map((s) => `${s.storeName}: ${s.quote}`).join(" | ")
          : relevantStores.length > 0
          ? "Store pickup unavailable at checked stores"
          : "No matching stores found in API response";
      } catch (err) {
        console.log("API data parse error, falling back to DOM scan:", err.message);
      }
    }

    // Fallback: DOM text scan (only if API data wasn't usable)
    if (!apiStoreData || (availableStores.length === 0 && unavailableStores.length === 0)) {
      try {
        await page
          .waitForFunction(
            () => {
              const bodyText = document.body.innerText.toLowerCase();
              return (
                bodyText.includes("currently unavailable") ||
                bodyText.includes("available today") ||
                bodyText.includes("available tomorrow") ||
                document.querySelector('div[data-autom="pickUpDetails"]') !== null
              );
            },
            { timeout: 15000 }
          )
          .catch(() => {});

        const statusCheck = await page.evaluate(() => {
          const pickupEl =
            document.querySelector('div[data-autom="pickUpDetails"]') ||
            document.querySelector(".rf-pickup-quote-info");
          const targetText = pickupEl ? pickupEl.innerText.toLowerCase() : document.body.innerText.toLowerCase();

          if (targetText.includes("currently unavailable") || targetText.includes("store pickup unavailable")) {
            return { available: false, msg: "Store pickup unavailable" };
          }
          if (
            (targetText.includes("available today") ||
              targetText.includes("available tomorrow") ||
              targetText.includes("today at apple") ||
              targetText.includes("tomorrow at apple") ||
              targetText.includes("apple saket") ||
              targetText.includes("apple noida") ||
              targetText.includes("apple bkc")) &&
            !targetText.includes("currently unavailable at")
          ) {
            return { available: true, msg: "Pickup available at Apple Store (DOM fallback)" };
          }
          return { available: false, msg: "Store pickup unavailable" };
        });

        inStock = statusCheck.available;
        storeMessage = statusCheck.msg;
      } catch (err) {
        console.log("DOM evaluation error:", err.message);
      }
    }

    try {
      await browser.close();
    } catch (e) {
      console.log("DEBUG: browser.close() error (safe to ignore):", e.message);
    }

    return {
      inStock,
      price,
      storeMessage,
      availablePincodes: availableStores.map((s) => s.storeName),
      unavailablePincodes: unavailableStores.map((s) => s.storeName),
      partNumber: availableStores[0]?.partNumber || unavailableStores[0]?.partNumber || null,
      storeDetails: availableStores.map((s) => ({
        storeName: s.storeName,
        storeNumber: s.storeNumber,
        city: s.city,
        quote: s.quote,
      })),
    };
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // ignore — browser may already be gone (e.g. frame detached)
      }
    }
    console.error("❌ Apple Store Check Error:", error.message);
    return {
      inStock: false,
      price: null,
      storeMessage: "Error checking store",
      availablePincodes: [],
      unavailablePincodes: [],
    };
  }
}

module.exports = checkAppleStore;