import { Cluster } from "puppeteer-cluster";
import UserAgent from "user-agents";
// import { clickWithHumanLikeMovement } from "./actions.js";
import { delay } from "./delay.js";
import { desktopRandomViewports } from "./viewports.js";
import { saveCookies } from "./utils/cookies.js";
import { interactWithPage } from "./actions.js";

function getRandomMobileViewport() {
  return desktopRandomViewports[
    Math.floor(Math.random() * desktopRandomViewports.length + 1)
  ];
}

const userAgent = new UserAgent({ deviceCategory: "desktop" });
const randomViewport = getRandomMobileViewport();

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 3,
    puppeteerOptions: {
      headless: false,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      // userDataDir: "C:/Users/HP/AppData/Local/Google/Chrome/User Data",
      ignoreDefaultArgs: ["--enable-automation"],
      ignoreHTTPSErrors: true,
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
      timeout: 200000,
    },
  });
  await cluster.task(async ({ page, data: searchText }) => {
    try {
      await page.goto("https://www.grammy.com/", {
        waitUntil: "domcontentloaded",
      });
      // await page.waitForSelector("#APjFqb");
      // await page.type("#APjFqb", searchText, { delay: 100 });
      // await page.keyboard.press("Enter");
      // await page.waitForNavigation({ waitUntil: "networkidle2" });
      await saveCookies(page);
      console.log("Cookie Saved");
      await interactWithPage(page, 40000);
      await delay(50000 + Math.random() * 50000);
    } catch (error) {
      console.log(error);
    }
  });
  cluster.queue("Bianca");
  cluster.queue("Grammy Award");
  cluster.queue("Saas");

  console.log("Shutting down...");
  await cluster.idle();
  await cluster.close();
})();
