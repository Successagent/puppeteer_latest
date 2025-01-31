import { Cluster } from "puppeteer-cluster";
import UserAgent from "user-agents";
// import { clickWithHumanLikeMovement } from "./actions.js";
import { delay } from "./delay.js";
import { injectLocalStorage } from "./injectLocal.js";
import { loadLocalStorage, saveLocalStorage } from "./localStorageManager.js";
import {
  getDesktopRandomViewport,
  mobileRandomViewports,
} from "./viewports.js";

function getRandomMobileViewport() {
  return mobileRandomViewports[
    Math.floor(Math.random() * mobileRandomViewports.length)
  ];
}

const userAgent = new UserAgent({ deviceCategory: "desktop" });
const randomViewport = getDesktopRandomViewport();

let index = 0;

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 3,
    puppeteerOptions: {
      headless: false,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      // userDataDir: "C:/Users/HP/AppData/Local/Google/Chrome/User Data",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        `--user-agent=${userAgent.toString()}`,
        "--disable-web-security",
        "--disable-features=site-per-process",
        "--font-render-hinting=none", // Reduce fingerprint variability
      ],
      defaultViewport: randomViewport,
      timeout: 100000,
    },
  });
  await cluster.task(async ({ page, data: url }) => {
    try {
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
      // Load existing localStorage data
      const storedData = await loadLocalStorage();
      await injectLocalStorage(page, storedData);

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 0,
      });

      // Perform search
      // await page.type("#APjFqb", searchText);
      // await page.keyboard.press("Enter");
      await delay(80000 + Math.random * 80000);
      console.log("Video Watched");

      // Save updated localStorage
      const newStorage = await page.evaluate(() =>
        Object.assign({}, localStorage)
      );
      await saveLocalStorage(newStorage);
    } catch (error) {
      console.log(error);
    }
  });

  cluster.queue("https://youtu.be/R5QNSd44MDo");
  cluster.queue("https://youtu.be/R5QNSd44MDo");
  cluster.queue("https://youtu.be/R5QNSd44MDo");
  cluster.queue("https://youtu.be/R5QNSd44MDo");
  // Function to continuously add tasks to the cluster
  // const addTasksContinuously = () => {
  //   setInterval(async () => {
  //     // cluster.queue("https://www.whatismybrowser.com/");
  //     // cluster.queue("https://www.google.com/");
  //     // cluster.queue("https://success-sport.vercel.app/");
  //     // cluster.queue("Saas Product");
  //     // cluster.queue("Crypto");
  //     // cluster.queue("Tech");
  //     // cluster.queue("https://bot.sannysoft.com");
  //   }, 10000); // Interval in milliseconds (e.g., 10 seconds)
  // };

  // Start adding tasks to the cluster continuously
  // addTasksContinuously();
  console.log("Shutting down...");
  await cluster.idle();
  await cluster.close();

  // const gracefulShutdown = async () => {
  //   process.exit(0);
  // };

  // Handle SIGINT signal (Ctrl+C)
  // process.on("SIGINT", gracefulShutdown);
  // process.on("SIGTERM", gracefulShutdown);
})();
