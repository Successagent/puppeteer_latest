import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";
import {
  androidDevices,
  androidTablets,
  ipadDevices,
  iphoneDevices,
} from "./devices.js";
import proxyChain from "proxy-chain";
import { loadCookies, saveCookies } from "./utils/cookies.js";
import {
  androidBypass,
  iphoneBypass,
  nuclearBypass,
} from "./bypassDevicesDetections.js";
import {
  clickWithHumanLikeMovement,
  getFilteredLinks,
  interactWithPage,
} from "./actions.js";
import { desktopRandomViewports } from "./viewports.js";
import UserAgent from "user-agents";
import { Cluster } from "puppeteer-cluster";
import { delay } from "./delay.js";

function getRandomDesktopViewport() {
  return desktopRandomViewports[
    Math.floor(Math.random() * desktopRandomViewports.length)
  ];
}

const oldProxyUrl =
  "http://c08b36d53680241c3a7d__cr.gb:255aa2804471961b@gw.dataimpulse.com:823";

// Configure stealth plugin with advanced options
puppeteer.use(
  StealthPlugin({
    addLanguage: "en-US,en",
    mockDeviceMemory: 4,
    mockScreenResolution: { width: 1080, height: 1920 },
  })
);

let index = 0;

let facebookAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/460.1.0.53.111;FBBV/615004879;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/17.4.1;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBCR/AT&T]";
let facebookandroidAgent =
  "Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230805.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/123.0.0.0 Mobile Safari/537.36 [FBAN/EMA;FBLC/en_US;FBAV/460.1.0.53.111;]";
const tiktokAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 TikTok/24.8.3";
const tiktokAndroidAgent =
  "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36 TikTok/24.8.3";
const snapChatAndroidAgent =
  "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36 Snapchat/12.55.0.75";
const snapChatAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/12.55.0.75 (iPhone14,2; iOS 16.5; gzip)";
// Duration settings (in minutes)

const safariAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
const MIN_WATCH_TIME = 0.3;
const MAX_WATCH_TIME = 0.4;

(async () => {
  const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl);
  console.log(newProxyUrl);
  const cluster = await Cluster.launch({
    maxConcurrency: 2,
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    puppeteer,
    puppeteerOptions: {
      headless: false,
      executablePath: executablePath(),
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
      ],
    },
    timeout: 90000,
    retryDelay: 5000,
    retryLimit: 10,
  });

  await cluster.on("taskerror", (err, data) => {
    console.log(`  Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: url }) => {
    const userAgent = new UserAgent({ deviceCategory: "desktop" });

    let selectIPhoneDevice =
      iphoneDevices[Math.floor(Math.random() * iphoneDevices.length - 1)];
    let selectAndroidDevice =
      androidDevices[Math.floor(Math.random() * androidDevices.length - 1)];
    let selectedIPadDevice =
      ipadDevices[Math.floor(Math.random() * ipadDevices.length - 1)];
    let selectedIPadTablets =
      androidTablets[Math.floor(Math.random() * androidTablets.length - 1)];

    const watchDuration =
      MIN_WATCH_TIME * 60 * 1000 +
      Math.floor(Math.random() * (MAX_WATCH_TIME - MIN_WATCH_TIME) * 60 * 1000);
    const desktopRandomViewport = getRandomDesktopViewport();
    console.log(ipadDevices);

    try {
      await loadCookies(page);

      // Desktop Settings
      // await page.setUserAgent(userAgent.toString());
      // await page.setViewport(desktopRandomViewport);
      // await nuclearBypass(page, userAgent.toString());

      // Android Settings
      // await page.emulate(selectAndroidDevice);
      // await androidBypass(page);
      // await page.setUserAgent(facebookandroidAgent);

      // iPhone Settings
      await page.emulate(selectIPhoneDevice);
      await iphoneBypass(page, selectIPhoneDevice.userAgent);
      await page.setUserAgent(facebookAgent);
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      const currentuserAgent = await page.evaluate(() => navigator.userAgent);
      console.log("User-Agent from page:", currentuserAgent);
      // Load cookies
      // Save cookies

      // Interact with the page
      await interactWithPage(page, watchDuration);
      let firstSelector = `#option_one`;
      await page.click(firstSelector);

      await page.waitForSelector("body");
      await interactWithPage(page, watchDuration);
      console.log("Task completed " + index++);
    } catch (error) {
      console.log(error);
    }
  });

  // Create an array of 100 URLs and queue them
  const urls = Array(50).fill("https://astro-studioz-movies.vercel.app/");
  urls.forEach((url) => cluster.queue(url));

  await cluster.idle();
  await cluster.close();
})();
