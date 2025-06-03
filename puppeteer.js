import puppeteer from "puppeteer";
import {
  compareSelectedTeams,
  getTopTenTeams,
  goToBackAndGotoOver2GoalsSelection,
  gotoTable,
} from "./actions.js";
// This script uses Puppeteer to scrape the top 10 teams that won their last match

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the standings page
  await page.goto("https://m.betking.com/virtual/league/kings-bundliga", {
    waitUntil: "networkidle2",
  });

  async function runPuppeteerScript() {
    try {
      console.log("Page loaded successfully");
      let teamsWithLastWin = [];
      let filteredMatches = [];

      await gotoTable(page);
      await getTopTenTeams(page, teamsWithLastWin);
      await goToBackAndGotoOver2GoalsSelection(page);
      await compareSelectedTeams(page, filteredMatches);
    } catch (error) {
      console.error("Error running Puppeteer script:", error);
    } finally {
      setTimeout(runPuppeteerScript, 80 * 1000);
    }
  }

  await runPuppeteerScript();
})();
