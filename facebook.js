import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import proxyChain from "proxy-chain";
import {
  androidBypass,
  cdpBypass,
  iphoneBypass,
} from "./bypassDevicesDetections.js";
import { clickWithHumanLikeMovement, interactWithPage } from "./actions.js";
import { Cluster } from "puppeteer-cluster";
import { androidDevices, iphoneDevices } from "./devices.js";
import { delay } from "./delay.js";
import { mobileViewports } from "./viewports.js";
import UserAgent from "user-agents";

function getMobileViewport() {
  return mobileViewports[Math.floor(Math.random() * mobileViewports.length)];
}

const mobileViewport = getMobileViewport();
const mobileAgents = new UserAgent({ deviceCategory: "mobile" }).toString();

// const oldProxyUrl =
//   "http://3f5873dabec0cf1a712b__cr.us:6b30e2bd848ca264@gw.dataimpulse.com:823";
// const oldProxyUrl =
//   "http://3f5873dabec0cf1a712b__cr.lt:6b30e2bd848ca264@gw.dataimpulse.com:823";
// const oldProxyUrl =
//   "http://3f5873dabec0cf1a712b__cr.lt:6b30e2bd848ca264@gw.dataimpulse.com:823";
// const oldProxyUrl =
//   "http://3f5873dabec0cf1a712b__cr.lt:6b30e2bd848ca264@gw.dataimpulse.com:823";
// const oldProxyUrl =
//   "http://3f5873dabec0cf1a712b__cr.nl:6b30e2bd848ca264@gw.dataimpulse.com:823";
const oldProxyUrl =
  "http://3f5873dabec0cf1a712b__cr.lt,nl,ng,za,gb,us:6b30e2bd848ca264@gw.dataimpulse.com:823";

let index = 0;

const MIN_WATCH_TIME = 0.3;
const MAX_WATCH_TIME = 0.5;
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
        `--proxy-server=${newProxyUrl}`,
        `--user-agent=${mobileAgents}`,
      ],
      defaultViewport: {
        width: mobileViewport.width,
        height: mobileViewport.height,
      },
    },
    timeout: 100000,
  });

  await cluster.on("taskerror", (err, data) => {
    console.log(`  Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: url }) => {
    const newTabPromise = new Promise((resolve) => page.once("popup", resolve));

    const SelectedIPhone =
      iphoneDevices[Math.floor(Math.random() * iphoneDevices.length)];
    const SelectedAndroid =
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
        await page.emulate(SelectedAndroid);
        await androidBypass(page);
        console.log("Android");
      }
      if (userAgent.includes("iPhone")) {
        await page.emulate(SelectedIPhone);
        await iphoneBypass(page, SelectedIPhone.userAgent);
        console.log("iPhone");
      }
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
      await blockRequest(newTab);
      await delay(watchDuration / 2);
      await interactWithPage(newTab, watchDuration / 2);

      console.log("Task completed " + index++);
      await newTab.close();
    } catch (error) {
      console.log(error);
    }
  });

  // Create an array of 100 URLs and queue them
  const urls = Array(30).fill(
    // "https://moviedownloadlinks.vercel.app/movies/moana-part-2"
    // "https://oodruhoufouzair.com/4/9036596"
    // "https://oodruhoufouzair.com/4/9036596",
    // "https://oodruhoufouzair.com/4/9036596",
    // "https://oodruhoufouzair.com/4/9036596"
    "https://moviedownloadlinks.vercel.app/movies/kraven-the-hunter"
    // "https://moviedownloadlinks.vercel.app/movies/kraven-the-hunter"
  );
  urls.forEach((url) => cluster.queue(url));

  // Shutdown after everything is done

  await cluster.idle();
  await cluster.close();
})();
