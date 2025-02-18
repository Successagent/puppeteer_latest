import { Cluster } from "puppeteer-cluster";
import UserAgent from "user-agents";
// import { clickWithHumanLikeMovement } from "./actions.js";
import { delay } from "./delay.js";
import { desktopRandomViewports } from "./viewports.js";
import { saveCookies } from "./utils/cookies.js";
import { interactWithPage } from "./actions.js";
import { saveLocalStorage } from "./localStorageManager.js";
import proxyChain from "proxy-chain";

function getRandomMobileViewport() {
  return desktopRandomViewports[
    Math.floor(Math.random() * desktopRandomViewports.length + 1)
  ];
}

const userAgent = new UserAgent({ deviceCategory: "desktop" });
const randomViewport = getRandomMobileViewport();

const oldProxyUrl =
  "http://c08b36d53680241c3a7d__cr.gb:255aa2804471961b@gw.dataimpulse.com:823";

(async () => {
  const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl);
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
        `--proxy-server=${newProxyUrl}`,
      ],
      defaultViewport: randomViewport,
      timeout: 200000,
    },
  });
  await cluster.task(async ({ page, data: url }) => {
    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });
      // await page.waitForSelector("#APjFqb");
      // await page.type("#APjFqb", searchText, { delay: 100 });
      // await page.keyboard.press("Enter");
      // await page.waitForNavigation({ waitUntil: "networkidle2" });
      await saveCookies(page);
      const newStorage = await page.evaluate(() =>
        Object.assign({}, localStorage)
      );
      await saveLocalStorage(newStorage);
      console.log("Cookie Saved");
      await delay(40000);
      await delay(50000 + Math.random() * 50000);
    } catch (error) {
      console.log(error);
    }
  });
  cluster.queue("https://hyss-neck.com/");
  cluster.queue("https://www.exness.com/");
  cluster.queue("https://www.grammy.com/");

  console.log("Shutting down...");
  await cluster.idle();
  await cluster.close();
})();
