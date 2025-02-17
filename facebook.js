import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import proxyChain from "proxy-chain";
import {
  androidBypass,
  cdpBypass,
  iphoneBypass,
} from "./bypassDevicesDetections.js";
import { interactWithPage } from "./actions.js";
import { mobileViewports } from "./viewports.js";
import { Cluster } from "puppeteer-cluster";
import UserAgent from "user-agents";
import { androidDevices, iphoneDevices } from "./devices.js";

function getMobileViewport() {
  return mobileViewports[Math.floor(Math.random() * mobileViewports.length)];
}

const mobileAgents = new UserAgent({ deviceCategory: "mobile" }).toString();
const mobileView = getMobileViewport();

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
        // "--enable-unsafe-swiftshader",
        `--user-agent=${mobileAgents}`,
      ],
      defaultViewport: mobileView,
    },
    timeout: 110000,
  });

  await cluster.on("taskerror", (err, data) => {
    console.log(`  Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: url }) => {
    const newTabPromise = new Promise((resolve) => page.once("popup", resolve));

    const SelectedIPhone =
      iphoneDevices[Math.floor(Math.random() * iphoneDevices.length)];
    const selectedAndroid =
      androidDevices[Math.floor(Math.random() * androidDevices.length)];

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
      const userAgent = await page.evaluate(() => navigator.userAgent);
      if (userAgent.includes("Android")) {
        await page.emulate(selectedAndroid);
        await androidBypass(page);
        console.log("Android");
      } else if (userAgent.includes("iPhone")) {
        await page.emulate(SelectedIPhone);
        await iphoneBypass(page, mobileAgents);
        console.log("iPhone");
      }
      await iphoneBypass(page, mobileAgents);
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await cdpBypass(page);

      await interactWithPage(page, watchDuration);
      const selector = "html > iframe:nth-child(5)";
      const iframesBanner = await page.$(selector);
      const contents = await iframesBanner.contentFrame();
      await contents.click("span");

      // Get the new tab from the popup event
      const newTab = await newTabPromise;

      // Switch to the new tab
      await newTab.bringToFront();
      await blockRequest(newTab);
      await interactWithPage(newTab, watchDuration);
      console.log("Task completed " + index++);
      await newTab.close();
    } catch (error) {
      console.log(error);
    }
  });

  // Create an array of 100 URLs and queue them
  const urls = Array(50).fill(
    // "https://video.solextrade.org/movies/moana-part-2"
    "https://video.solextrade.org/movies/venom-last-dance"
    // "https://video.solextrade.org/movies/invincible-season-3"
    // "https://video.solextrade.org/movies/kraven-the-hunter"
  );
  urls.forEach((url) => cluster.queue(url));

  await cluster.idle();
  await cluster.close();
})();
