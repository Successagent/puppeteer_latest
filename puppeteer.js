import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import vanillaPuppeteer from "puppeteer";
const puppeteer = addExtra(vanillaPuppeteer);
puppeteer.use(StealthPlugin());
import UserAgent from "user-agents";

const userAgent = new UserAgent();
const randomUseragent = userAgent.toString({ deviceCategory: "mobile" });
console.log(`Using User-Agent: ${randomUseragent}`);

import { trackTimerValue } from "./actions.js";
// This script uses Puppeteer to scrape the top 10 teams that won their last match

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Set a random user agent for the page
  await page.setUserAgent(randomUseragent);
  // Set viewport to a mobile size
  await page.setViewport({
    width: 375,
    height: 600,
    deviceScaleFactor: 2,
  });
  // Navigate to the standings page
  await page.goto("https://m.betking.com/virtual/league/kings-bundliga", {
    waitUntil: "networkidle2",
    timeout: 50000,
  });

  async function runPuppeteerScript() {
    try {
      console.log("Page loaded successfully");
      let teamsWithLastWin = [];
      let filteredMatches = [];
      let gamesPlayed = 0;

      await trackTimerValue(
        teamsWithLastWin,
        filteredMatches,
        page,
        browser,
        gamesPlayed
      );
    } catch (error) {
      console.error("Error running Puppeteer script:", error);
    }
  }

  await runPuppeteerScript();
})();
