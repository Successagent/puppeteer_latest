import fs from "fs";
import nodemailer from "nodemailer";

async function analyzeMatches(page) {
  const matches = await page.$$(".teams"); // Get first 9 matches

  // 1. Look for BMU matches and play Over 2.5

  for (let match of matches.slice(0, 9)) {
    const home = await match.$eval('[data-testid="match-home-team"]', (el) =>
      el.textContent.trim()
    );
    const away = await match.$eval('[data-testid="away-home-team"]', (el) =>
      el.textContent.trim()
    );

    if (home.includes("BMU") || away.includes("BMU")) {
      console.log(`BMU match found: ${home} vs ${away}`);

      // Click the market toggle inside this match
      const over2Market = '[data-testid="o/u-2.5-market"]';
      await page.waitForSelector(over2Market);
      await page.click(over2Market);
      await delay(2000); // Wait for market to load
      console.log("Clicked Over/Under 2.5 market, waiting for odds…");

      // Wait globally for odds to load
      await page.waitForSelector('[data-testid="match-odd-value"]', {
        timeout: 5000,
      });

      // Grab the first odd (usually Over 2.5)
      const overOdd = (await page.$$(' [data-testid="match-odd-value"]'))[0];
      if (!overOdd) {
        console.log("❌ Odds not found after expanding market");
        continue;
      }
      const footerHeight = 50; // Adjust to your header height
      // Make sure odds element is still valid before using
      if (overOdd && (await overOdd.boundingBox())) {
        await page.evaluate(
          (el, footerHeight) => {
            const rect = el.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // If element is covered by footer or outside viewport
            if (rect.bottom > viewportHeight - footerHeight || rect.top < 0) {
              const scrollPosition =
                rect.top + window.scrollY - viewportHeight / 2;
              window.scrollTo({ top: scrollPosition, behavior: "smooth" });
            }

            // Click inside page context
            el.click();
          },
          overOdd,
          footerHeight
        );

        console.log("✅ Successfully scrolled and clicked Over 2.5 odd");
      } else {
        console.log("⚠️ overOdd element missing or not visible anymore");
      }

      const overOdds = await page.evaluate(
        (el) => el.textContent.trim(),
        overOdd
      );

      const result = {
        matchup: `${home} vs ${away}`,
        overOdds,
      };

      console.log("✅ Result:", result);
      addNewMatch(result); // Save to data.json
      await getOptionToStake(page, overOdds);
      console.log("Waiting for 1.5 seconds before next action...");

      await delay(1500); // wait for bet slip
    }
  }
}

export const gotoTable = async (page) => {
  const hamburger = ".view-switch-icon";
  await page.waitForSelector(hamburger);
  await page.click(hamburger);

  await delay(1000);
  console.log("Table is now visible");
};

export const goToBackAndGotoGoalGoalOption = async (page) => {
  const backButton = ".close-icon";
  await page.waitForSelector(backButton);
  await page.click(backButton);

  await delay(1000);
  console.log("Navigated back");

  const over2Market = '[data-testid="o/u-2.5-market"]';
  await page.waitForSelector(over2Market);
  await page.click(over2Market);

  console.log("Goal Goal Market is now visible");
  await delay(1000);
};

const getOptionToStake = async (page, goalOdd) => {
  // const betSlipSelector =
  //   "body > app-root > app-wrapper > app-nav-bar > div > app-nav-bar-items > div > div.nav-bar-item.middle.ng-star-inserted";
  // await Promise.all([
  //   await delay(1000),
  //   await page.waitForSelector(betSlipSelector, { visible: true }),
  //   await page.click(betSlipSelector),
  //   console.log("Betslip Clicked"),
  // ]);
  let stakeAmount;
  let lastGamePlayed = JSON.parse(fs.readFileSync("lastgame.json", "utf-8")); // Default to "W" if file doesn't exist or is empty
  // Step 4: Go BetSlip Page

  if (lastGamePlayed === "L") {
    const previousGameData = loadData();
    let previousGameOdds = previousGameData.last.overOdds;
    let previousStakeAmount;
    if (fs.existsSync("previousStakeAmount.json")) {
      const data = fs.readFileSync("previousStakeAmount.json", "utf-8");
      previousStakeAmount = JSON.parse(data);
    }
    // Step 5: Calculate the stake amount
    const oddValue = parseFloat(goalOdd);
    console.log(goalOdd);

    stakeAmount = calculationForLostGames(
      previousGameOdds,
      oddValue,
      previousStakeAmount
    );
    fs.writeFileSync(
      "previousStakeAmount.json",
      JSON.stringify(stakeAmount.toFixed(2), null, 2)
    );
  } else {
    // Step 5: Calculate the stake amount
    const oddValue = parseFloat(goalOdd);
    stakeAmount = calculationForFreshGame(oddValue);

    fs.writeFileSync(
      "previousStakeAmount.json",
      JSON.stringify(stakeAmount.toFixed(2), null, 2)
    );
  }

  // // Put the stake amount in the input field
  // const stakeInputSelector = '[data-testid="coupon-totals-stake-amount-value"]';
  // const closeOdd = '[data-testid="coupon-place-bet-btn"]';

  // await Promise.all([
  //   await page.waitForSelector(stakeInputSelector, { visible: true }),
  //   await page.focus(stakeInputSelector),
  //   await page.click(stakeInputSelector, { clickCount: 5, delay: 300 }), // Clear the input
  //   await page.type(stakeInputSelector, stakeAmount.toFixed(2)),

  //   // Step 6: Place the bet
  //   await page.waitForSelector(closeOdd),
  //   await page.click(closeOdd, { delay: 200 }),
  // ]);

  await delay(2000);
  // Step 6: Place the bet
  // const continueButton = await page.waitForSelector("span.btn-text", {
  //   visible: true,
  //   timeout: 5000,
  // });

  // const buttonText = await page.evaluate(
  //   (button) => button.textContent,
  //   continueButton
  // );
  // if (buttonText.includes("Continue Betting")) {
  //   await delay(4500);
  //   await continueButton.click();
  //   console.log('Clicked "Continue Betting" button');
  // } else {
  //   console.log("Button with correct text not found");
  // }
};

const calculationForFreshGame = (oddValue = 1.78) => {
  // const lastMatchPlayed = "L";
  const odd = oddValue - 1;
  const profitToMake = 15;
  let totalAmountLost = profitToMake;
  let stakeAmount = totalAmountLost / odd;
  return stakeAmount;
};
const calculationForLostGames = (
  oldOdd = 1.78,
  newOdd = 1.55,
  previousAmountStake
) => {
  let oddToStake = newOdd - 1;
  let totalAmountLost = previousAmountStake * oldOdd;
  let newStakeAmount = totalAmountLost / oddToStake;
  return newStakeAmount;
};

const navigateTabs = async (page, text) => {
  await page.waitForSelector('[data-testid="results-page-tab-standings"]'); // Wait for tabs to load

  await page.evaluate((title) => {
    const tabs = Array.from(
      document.querySelectorAll('[data-testid="results-page-tab-standings"]')
    );
    const resultsTab = tabs.find((tab) => tab.textContent.trim() === title);
    if (resultsTab) {
      resultsTab.click();
    }
  }, text);
  console.log(`Navigated to ${text} Page`);
  await delay(1500);
};

export async function trackTimerValue(
  teamsWithLastWin,
  filteredMatches,
  page,
  gamesPlayed
) {
  while (true) {
    try {
      const elementHandle = await page.$(".countdown-timer");
      // If the element is not found, it might be hidden or not yet rendered

      if (elementHandle) {
        const timerValue = await page.evaluate(
          (el) => el.textContent.trim(),
          elementHandle
        );
        let secondsLeft = parseInt(timerValue.split(":")[1], 10);
        if (secondsLeft === 50) {
          const elementText = await page.$eval(".week", (el) => el.textContent);
          const match = elementText.match(/\d+/); // Extracts the first sequence of digits
          const currentWeek = match ? parseInt(match[0], 10) : null;
          const weeksLeft = 34 - currentWeek + 1;
          console.log(weeksLeft);

          if (
            currentWeek >= 1
            //  && weeksLeft > 7
          ) {
            await CheckAndPlaySelectedOption(
              page,
              gamesPlayed,
              teamsWithLastWin,
              filteredMatches
            );
            console.log("Right time to play");

            gamesPlayed++;
            console.log(`Games played: ${gamesPlayed}`);
          }
        }
      } else {
        console.log("Timer element not found, waiting for it to reappear...");
        await page.waitForSelector(".countdown-timer", { timeout: 0 }); // Wait indefinitely until it comes back
        console.log("Timer element has reappeared!");
      }
    } catch (err) {
      console.error("Error reading timer:", err);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every second
  }
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let filePath = "data.json";
function loadData() {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  }
  return { last: null, recent: null };
}

// Save the updated two
function saveData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Add a new object
function addNewMatch(newMatch) {
  const data = loadData();
  data.last = data.recent;
  data.recent = newMatch;
  saveData(data);
}

export const gotoResults = async (page) => {
  // Navigate to the results page
  gotoTable(page);

  navigateTabs(page, "Results");

  getFullTimeScore(page);
};

const getFullTimeScore = async (page) => {
  // Load last match data
  const data = loadData();
  const lastMatch = data.recent.matchup;
  const [lastHomeTeam, lastAwayTeam] = lastMatch
    .split(" vs ")
    .map((s) => s.trim());

  console.log(lastHomeTeam, lastAwayTeam);

  await page.waitForSelector("mvs-tournament-results");

  const results = await page.$$eval(
    "mvs-tournament-results .row.ng-star-inserted",
    (rows) => {
      return rows.slice(0, 9).map((row) => {
        const index = row
          .querySelector('[data-testid="results-index"]')
          ?.textContent.trim();
        const homeTeam = row
          .querySelector('[data-testid="results-home-team"]')
          ?.textContent.trim();
        const awayTeam = row
          .querySelector('[data-testid="results-away-team"]')
          ?.textContent.trim();
        const halfTime = row
          .querySelector('[data-testid="results-ht"]')
          ?.textContent.trim();
        const fullTime = row
          .querySelector('[data-testid="results-ft"]')
          ?.textContent.trim();
        return {
          index,
          homeTeam,
          awayTeam,
          halfTime,
          fullTime,
        };
      });
    }
  );

  const filteredMatches = results.find((match) => {
    return match.homeTeam === lastHomeTeam && match.awayTeam === lastAwayTeam;
  });

  const fullTimeScore = filteredMatches ? filteredMatches.fullTime : null;

  console.log(fullTimeScore);

  if (fullTimeScore) {
    console.log(`Full-time score ${fullTimeScore}`);
    const [homeScore, awayScore] = fullTimeScore.split("-").map(Number);

    let lastGamePlayed = "W"; // Default to Win
    let score = 0;
    if (homeScore === 0) {
      score = awayScore;
    } else {
      score = homeScore + awayScore;
    }
    console.log(score);

    if (score >= 3) {
      lastGamePlayed = "W"; // Win if score >= 3
    } else {
      lastGamePlayed = "L"; // Loss if score < 3
    }
    console.log(`Last game played: ${lastGamePlayed}`);
    handleNewValue(lastGamePlayed);
    console.log(`Total Wins: ${getAllW()}, Total Losses: ${getAllL()}`);
    fs.writeFileSync("lastgame.json", JSON.stringify(lastGamePlayed, null, 2));
  } else {
    console.log("No match found for the last game played.");
  }
};

const resultArray = []; // Store W and L

// Imagine this function runs every minute with the new value
function handleNewValue(newValue) {
  resultArray.push(newValue);
}

// Filter later
function getAllW() {
  return resultArray.filter((item) => item === "W").length;
}

function getAllL() {
  return resultArray.filter((item) => item === "L").length;
}

const CheckAndPlaySelectedOption = async (page, gamesPlayed) => {
  if (gamesPlayed === 0) {
    await analyzeMatches(page);
    await delay(4000);
  } else {
    gotoResults(page);
    await delay(4000);
    const backButton = ".close-icon";
    await page.waitForSelector(backButton);
    await page.click(backButton);
    await analyzeMatches(page);
    await delay(4000);
  }
};

const sendMailNotification = (currentWeek) => {
  console.log("Week is less than 8, stopping the script.");
  const transport = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: "support@movieseriesdownload.online",
      pass: "Mieski55#",
    },
  });
  // email notification for the admin
  const adminMailOptions = {
    from: "support@movieseriesdownload.online",
    to: "miesineagent@gmail.com",
    subject: "Trade Stopped",
    html: `<p>Week is less than 8, stopping the script.</p><p>Current week: ${currentWeek} and waiting to start at week 2. Games Played: ${
      resultArray.length
    }, Here are the latest results:\n\n${resultArray.join(
      ", "
    )} Total Won: ${getAllW()}, Total Loss: ${getAllL()} </p>`,
  };
  transport.sendMail(adminMailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Admin email sent: " + info.response);
    }
  });

  console.log("Email notification sent to admin about stopping the script.");
};
