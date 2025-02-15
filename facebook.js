import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import proxyChain from "proxy-chain";
import {
  androidBypass,
  cdpBypass,
  iphoneBypass,
  nuclearBypass,
} from "./bypassDevicesDetections.js";
import { interactWithPage } from "./actions.js";
import {
  desktopRandomViewports,
  mobileViewports,
  tabletViewports,
} from "./viewports.js";
import { Cluster } from "puppeteer-cluster";
import UserAgent from "user-agents";
import { loadCookies } from "./utils/cookies.js";

function getRandomDesktopViewport() {
  return desktopRandomViewports[
    Math.floor(Math.random() * desktopRandomViewports.length)
  ];
}
function getMobileViewport() {
  return mobileViewports[Math.floor(Math.random() * mobileViewports.length)];
}
function getTabletViewport() {
  return tabletViewports[Math.floor(Math.random() * tabletViewports.length)];
}

const userAgent = new UserAgent({ deviceCategory: "desktop" }).toString();
const mobileAgents = new UserAgent({ deviceCategory: "mobile" }).toString();
const tabletAgents = new UserAgent({ deviceCategory: "tablet" }).toString();
const desktopRandomView = getRandomDesktopViewport();
const mobileView = getMobileViewport();
const tabletView = getTabletViewport();

console.log(mobileAgents);

const oldProxyUrl =
  "http://c08b36d53680241c3a7d__cr.gb:255aa2804471961b@gw.dataimpulse.com:823";

// Configure stealth plugin with advanced options

let index = 0;

const MIN_WATCH_TIME = 0.3;
const MAX_WATCH_TIME = 0.35;

puppeteer.use(StealthPlugin());
(async () => {
  const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl);
  const cluster = await Cluster.launch({
    maxConcurrency: 3,
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    puppeteerOptions: {
      headless: false,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      ignoreDefaultArgs: ["--enable-automation"],
      ignoreHTTPSErrors: true,
      args: [
        `--test-type=gpu`,
        `--enable-process-per-site-up-to-main-frame-threshold`,
        `--disable-blink-features=AutomationControlled`,
        "--disable-webrtc-encryption",
        "--disable-webrtc-multiple-routes",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--use-gl=desktop",
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        "--disable-features=IsolateOrigins,site-per-process",
        // `--proxy-server=${newProxyUrl}`,
        `--user-agent=${mobileAgents}`,
      ],
      defaultViewport: mobileView,
    },
    timeout: 100000,
  });

  await cluster.on("taskerror", (err, data) => {
    console.log(`  Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: url }) => {
    const userAgent = new UserAgent({ deviceCategory: "desktop" }).toString();
    const mobileAgents = new UserAgent({ deviceCategory: "mobile" }).toString();
    const tabletAgents = new UserAgent({ deviceCategory: "tablet" }).toString();
    const desktopRandomView = getRandomDesktopViewport();
    const mobileView = getMobileViewport();
    const tabletView = getTabletViewport();

    const watchDuration =
      MIN_WATCH_TIME * 60 * 1000 +
      Math.floor(Math.random() * (MAX_WATCH_TIME - MIN_WATCH_TIME) * 60 * 1000);
    console.log(watchDuration);

    const blockRequest = async (page) => {
      const blockedTypes = ["image"];
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (!request.isInterceptResolutionHandled())
          if (blockedTypes.includes(request.resourceType())) {
            request.abort();
          } else {
            request.continue();
          }
      });
    };

    try {
      await page.setViewport(mobileView);
      await page.setUserAgent(mobileAgents);
      const userAgent = await page.evaluate(() => navigator.userAgent);
      if (userAgent.includes("Android")) {
        await androidBypass(page);
        console.log("Android");
      } else if (userAgent.includes("iPhone")) {
        await iphoneBypass(page, mobileAgents);
        console.log("iPhone");
      }
      await iphoneBypass(page, mobileAgents);
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });
      console.log(userAgent);

      await cdpBypass(page);

      await loadCookies(page);

      await interactWithPage(page, watchDuration);
      const selector = "html > iframe:nth-child(5)";
      const iframesBanner = await page.$(selector);
      const contents = await iframesBanner.contentFrame();
      await contents.click("span");
      await blockRequest(page);
      await page.waitForNavigation();
      await interactWithPage(page, watchDuration);
      console.log("Task completed " + index++);
    } catch (error) {
      console.log(error);
    }
  });

  // Create an array of 100 URLs and queue them
  const urls = Array(50).fill(
    "https://movies.solextrade.org/movies/moana-part-2"
    // "https://movies.solextrade.org/movies/venom-last-dance",
    // "https://movies.solextrade.org/movies/invincible-season-3"
    // "https://movies.solextrade.org/movies/kraven-the-hunter"
  );
  urls.forEach((url) => cluster.queue(url));

  await cluster.idle();
  await cluster.close();
})();
