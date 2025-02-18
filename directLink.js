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
import { loadCookies, saveCookies } from "./utils/cookies.js";
import { executablePath } from "puppeteer";

const oldProxyUrl =
  "http://c08b36d53680241c3a7d__cr.gb:255aa2804471961b@gw.dataimpulse.com:823";

// Configure stealth plugin with advanced options

let index = 0;

const MIN_WATCH_TIME = 0.3;
const MAX_WATCH_TIME = 0.35;

const faceAndroidUserAgent =
  "Mozilla/5.0 (Android 13; Mobile; rv:122.0) Gecko/122.0 Firefox/122.0 [FBAN/FB4A;FBAV/452.0.0.41.109]";
const iPhoneuserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) FxiOS/122.0 Mobile/15E148 Safari/537.36 [FBAN/FBIOS;FBAV/452.0.0.41.109]";
const iPhoneFacebookuserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/537.36 [FBAN/FBIOS;FBAV/452.0.0.41.109;]";

puppeteer.use(StealthPlugin());
(async () => {
  const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl);
  const cluster = await Cluster.launch({
    maxConcurrency: 1,
    concurrency: Cluster.CONCURRENCY_CONTEXT,
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
        // "--enable-unsafe-swiftshader",
        // `--user-agent=${iPhoneuserAgent}`,
      ],
    },
    timeout: 110000,
  });

  await cluster.on("taskerror", (err, data) => {
    console.log(`  Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: url }) => {
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
      await page.emulate(selectedAndroid);
      await page.setUserAgent(faceAndroidUserAgent);
      await loadCookies(page);

      const userAgent = await page.evaluate(() => navigator.userAgent);
      if (userAgent.includes("Android")) {
        await androidBypass(page);
        console.log("Android");
      } else if (userAgent.includes("iPhone")) {
        await iphoneBypass(page, SelectedIPhone.userAgent);
        console.log("iPhone");
      }
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await cdpBypass(page);

      console.log(userAgent);

      await interactWithPage(page, watchDuration);
      const selector =
        "#root > section > section > div.movie_section_img > ul > li:nth-child(1) > a";

      await page.click(selector);

      //   await blockRequest(page);
      await interactWithPage(page, watchDuration);
      console.log("Task completed " + index++);
    } catch (error) {
      console.log(error);
    }
  });

  // Create an array of 100 URLs and queue them
  const urls = Array(50).fill(
    "https://astromovies.vercel.app/movies/moana-part-2"
  );
  urls.forEach((url) => cluster.queue(url));

  await cluster.idle();
  await cluster.close();
})();
