import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import proxyChain from "proxy-chain";
import {
  androidBypass,
  cdpBypass,
  iphoneBypass,
} from "./bypassDevicesDetections.js";
import { interactWithPage } from "./actions.js";
import { Cluster } from "puppeteer-cluster";
import { androidDevices, iphoneDevices } from "./devices.js";
import { delay } from "./delay.js";

const devices = [...iphoneDevices, ...androidDevices];
const randomDevice = devices[Math.floor(Math.random() * devices.length)];

console.log(randomDevice.userAgent);

const oldProxyUrl =
  "http://c08b36d53680241c3a7d__cr.us:255aa2804471961b@gw.dataimpulse.com:823";

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
        // `--proxy-server=${newProxyUrl}`,
        // "--enable-unsafe-swiftshader",
        `--user-agent=${randomDevice.userAgent}`,
      ],
      defaultViewport: {
        width: randomDevice.screenWidth,
        height: randomDevice.screenHeight,
      },
    },
    timeout: 100000,
  });

  await cluster.on("taskerror", (err, data) => {
    console.log(`  Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: url }) => {
    const newTabPromise = new Promise((resolve) => page.once("popup", resolve));

    const selectediPhone =
      iphoneDevices[Math.floor(Math.random() * devices.length)];
    const selectedAndroid =
      androidDevices[Math.floor(Math.random() * devices.length)];

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
        await page.setUserAgent(selectedAndroid.userAgent);
        await page.setViewport({
          width: selectedAndroid.screenWidth,
          height: selectedAndroid.screenHeight,
        });
        await androidBypass(page);
        console.log("Android");
      }
      if (userAgent.includes("iPhone")) {
        await page.setUserAgent(selectediPhone.userAgent);
        await page.setViewport({
          width: selectediPhone.screenWidth,
          height: selectediPhone.screenHeight,
        });
        await iphoneBypass(page, selectediPhone.userAgent);
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
      await newTab.bringToFront();
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
  const urls = Array(100).fill(
    // "https://moviedownloadlinks.vercel.app/movies/moana-part-2"
    // "https://www.whatsmyua.info/"
    "https://moviedownloadlinks.vercel.app/movies/invincible-season-3"
    // "https://moviedownloadlinks.vercel.app/movies/kraven-the-hunter"
    // "https://moviedownloadlinks.vercel.app/movies/kraven-the-hunter"
  );
  urls.forEach((url) => cluster.queue(url));

  // Shutdown after everything is done

  await cluster.idle();
  await cluster.close();
})();
