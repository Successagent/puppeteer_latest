import { Cluster } from "puppeteer-cluster";
import UserAgent from "user-agents";
import { desktopRandomViewports, mobileRandomViewports } from "./viewports.js";
import { loadLocalStorage, saveLocalStorage } from "./localStorageManager.js";
import { injectLocalStorage } from "./injectLocal.js";
import { delay } from "./delay.js";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  androidBypass,
  iphoneBypass,
  nuclearBypass,
} from "./bypassDevicesDetections.js";
import { androidDevices, iphoneDevices } from "./devices.js";
puppeteer.use(StealthPlugin());

const YouTubeUrls = [
  "https://www.facebook.com/profile.php?id=61551017486558",
  "https://www.facebook.com/profile.php?id=61551017486558",

  // Add more YouTube URLs here
];

// Duration settings (in minutes)
const MIN_WATCH_TIME = 8;
const MAX_WATCH_TIME = 10;

const userAgent = new UserAgent({ deviceCategory: "desktop" });

function getRandomMobileViewport() {
  return mobileRandomViewports[
    Math.floor(Math.random() * mobileRandomViewports.length)
  ];
}
function getRandomDesktopViewport() {
  return desktopRandomViewports[
    Math.floor(Math.random() * desktopRandomViewports.length)
  ];
}

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2, // Adjust based on your system capabilities
    puppeteer,
    puppeteerOptions: {
      headless: false,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      // userDataDir: "C:/Users/HP/AppData/Local/Google/Chrome/User Data",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=site-per-process",
        "--font-render-hinting=none", // Reduce fingerprint variability
        "--disable-features=PreloadMediaEngagementData",
        "--autoplay-policy=no-user-gesture-required",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    },
    retryLimit: 3, // Retry failed tasks up to 3 times
    retryDelay: 5000, // Wait 5 seconds between retries
    timeout: 80000, // 1 minute timeout for each task
  });

  // Handle cluster task errors
  cluster.on("taskerror", (err, data) => {
    console.error(`Error crawling ${data}: ${err.message}`);
  });

  // Define task handler
  await cluster.task(async ({ page, data: url }) => {
    try {
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

      const selectedIPhoneDevice =
        iphoneDevices[Math.floor(Math.random() * iphoneDevices.length + 1)];
      // console.log(selectedIPhoneDevice);
      const selectedAndroidDevice =
        androidDevices[Math.floor(Math.random() * androidDevices.length + 1)];

      console.log(selectedAndroidDevice);

      await page.emulate(selectedAndroidDevice);
      await androidBypass(page);

      // Load existing localStorage data
      const storedData = await loadLocalStorage();
      await injectLocalStorage(page, storedData);
      // Set global timeouts first
      await page.setDefaultNavigationTimeout(120000); // 2 minutes for navigation
      await page.setDefaultTimeout(60000); // 1 minute for all element waits
      await page.setJavaScriptEnabled(true);
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: delay(9000 + Math.random() * 12000),
      });

      // Check if response exists
      if (!response) {
        throw new Error("Navigation failed: No response received");
      }

      // Check HTTP status
      if (!response.ok()) {
        console.log(`HTTP ${response.status()}: ${await response.text()}`);
        throw new Error(`Page load failed: HTTP ${response.status()}`);
      }

      console.log(`▶️ Started playback: ${url}`);

      // Simulate natural watching behavior
      const watchDuration = Math.floor(
        (Math.random() * (MAX_WATCH_TIME - MIN_WATCH_TIME) + MIN_WATCH_TIME) *
          60000
      );

      console.log(`⏳ Watching for ${watchDuration / 60000} minutes...`);

      // Save updated localStorage
      const newStorage = await page.evaluate(() =>
        Object.assign({}, localStorage)
      );
      await saveLocalStorage(newStorage);

      // // Progressive waiting with random interactions
      const startTime = Date.now();
      while (Date.now() - startTime < watchDuration) {
        // Random scrolls and mouse movements
        await page.mouse.move(Math.random() * 500, Math.random() * 500);

        await delay(15000 + Math.random() * 15000);

        // Random scroll down to comments section
        if (Math.random() > 0.7) {
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
        }
      }

      console.log(`✅ Completed watching: ${url}`);
    } catch (error) {
      console.error(`Final error processing ${url}: ${error.message}`);
      throw error;
    }
  });

  // Queue URLs
  for (const url of YouTubeUrls) {
    await cluster.queue(url);
  }

  // Close cluster when done
  await cluster.idle();
  await cluster.close();
})();
