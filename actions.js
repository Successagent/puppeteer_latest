import fs from "fs";
import nodemailer from "nodemailer";

export const getTopTenTeams = async (page, teamsWithLastWin) => {
  const groupSelector = ".group-standing";
  await page.waitForSelector(groupSelector);
  // Get all team name elements
  const teamNameElements = await page.$$(".team-name");
  // Get all last match result elements, skipping the first one (header)
  const lastMatchResultElements = (await page.$$(".form")).slice(1);

  // Calculate minimum count to align data
  const numItems = Math.min(
    teamNameElements.length,
    lastMatchResultElements.length
  );

  const results = [];

  for (let i = 0; i < numItems; i++) {
    const teamName = await teamNameElements[i].evaluate((el) =>
      el.textContent.trim()
    );
    const lastChild = await lastMatchResultElements[i].evaluate((el) => {
      const child = el.lastElementChild;
      return child ? child.textContent.trim() : "";
    });

    results.push({
      id: i + 1, // or start at 0 if you prefer
      team: teamName,
      value: lastChild,
    });
  }

  teamsWithLastWin = results.slice(0, 10).filter((team) => team.value === "W");
  fs.writeFileSync(
    "teamsWithLastWin.json",
    JSON.stringify(teamsWithLastWin, null, 2)
  );
  await delay(1000);
};

export const gotoTable = async (page) => {
  const hamburger = ".view-switch-icon";
  await page.waitForSelector(hamburger);
  await page.click(hamburger);

  await delay(1000);
  console.log("Table is now visible");
};

export const goToBackAndGotoOver2GoalsSelection = async (page) => {
  const backButton = ".close-icon";
  await page.waitForSelector(backButton);
  await page.click(backButton);

  await delay(1000);
  console.log("Navigated back");

  const over2Market = '[data-testid="o/u-2.5-market"]';
  await page.waitForSelector(over2Market);
  await page.click(over2Market);

  console.log("Over 2 Goals Market is now visible");
  await delay(1000);
};

export const compareSelectedTeams = async (page, filteredMatches) => {
  // Scrape the data
  const results = await page.evaluate(() => {
    // Adjust selectors below to match the website's structure
    const games = document.querySelectorAll(".match"); // each game container
    const data = [];

    games.forEach((game) => {
      const team1 = game.querySelector(".home-team").textContent.trim();
      const team2 = game.querySelector(".away-team").textContent.trim();

      // Over and under odds - adapt selectors to match actual markup
      const overOdds =
        game
          .querySelectorAll('[data-testid="match-odd-value"]')[0]
          ?.textContent.trim() || null;
      const underOdds =
        game
          .querySelectorAll('[data-testid="match-odd-value"]')[1]
          ?.textContent.trim() || null;

      data.push({
        matchup: `${team1} vs ${team2}`,
        overOdds,
        underOdds,
      });
    });

    return data;
  });

  const teamsWithLastWin = JSON.parse(
    fs.readFileSync("teamsWithLastWin.json", "utf-8")
  );

  // Create a flat array of team names
  const teamList = teamsWithLastWin.map((obj) => obj.team);

  filteredMatches = results.slice(0, 9).filter((game) => {
    const [team1, team2] = game.matchup
      .split(" vs ")
      .map((team) => team.trim());
    return teamList.includes(team1) || teamList.includes(team2);
  });

  fs.writeFileSync(
    "filteredMatches.json",
    JSON.stringify(filteredMatches, null, 2)
  );
  await delay(1000);
  getOptionToStake(page);
};

const getOptionToStake = async (page) => {
  const filteredMatches = JSON.parse(
    fs.readFileSync("filteredMatches.json", "utf-8")
  );

  // Step 1: Find the lowest overOdds object
  let lowestOddGame = filteredMatches.reduce((lowest, game) => {
    const currentOverOdd = parseFloat(game.overOdds);
    const lowestOverOdd = parseFloat(lowest.overOdds);
    return currentOverOdd < lowestOverOdd ? game : lowest;
  }, filteredMatches[0]);

  // Step 2: Compare the lowest overOdd to 1 or 2
  const lowestOverOddValue = parseFloat(lowestOddGame?.overOdds);

  let result;
  if (lowestOverOddValue <= 1 || lowestOverOddValue <= 2) {
    result = lowestOddGame;
  } else {
    result = filteredMatches[0];
  }

  console.log("Selected Matchup:", result.matchup);

  fs.unlinkSync("filteredMatches.json");
  fs.unlinkSync("teamsWithLastWin.json");
  addNewMatch(result);

  // Step 3: Click on the selected game

  const [homeTeam, awayTeam] = result.matchup.split(" vs ");

  const matches = await page.$$(".match");
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const match of matches.slice(0, 9)) {
    // Get the home and away team names from the match row
    const matchText = await match.evaluate((el) => el.innerText);

    if (matchText.includes(homeTeam) && matchText.includes(awayTeam)) {
      // Click the Over 2.5 button inside this match row
      const over2Button = await match.$('[data-testid="match-odd-value"]'); // Adjust selector
      const footerHeight = 50; // Adjust to your header height

      // Check if button is covered by fixed element
      const isButtonCovered = await page.evaluate(
        (button, footerHeight) => {
          const buttonRect = button.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          return buttonRect.bottom > viewportHeight - footerHeight;
        },
        over2Button,
        footerHeight
      );

      if (!(await over2Button.isIntersectingViewport()) || isButtonCovered) {
        await page.evaluate(
          (element, offset) => {
            const elementTop = element.getBoundingClientRect().top;
            const scrollPosition =
              elementTop + window.pageYOffset - offset - 300;
            window.scrollTo(0, scrollPosition);
          },
          over2Button,
          footerHeight
        );

        await delay(1500);
      }

      await over2Button.click();
    }
  }

  const betSlipSelector =
    "body > app-root > app-wrapper > app-nav-bar > div > app-nav-bar-items > div > div.nav-bar-item.middle.ng-star-inserted";
  await Promise.all([
    await delay(1000),
    await page.waitForSelector(betSlipSelector, { visible: true }),
    await page.click(betSlipSelector),
    console.log("Betslip Clicked"),
  ]);
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
    const oddValue = parseFloat(result.overOdds);
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
    const oddValue = parseFloat(result.overOdds);
    stakeAmount = calculationForFreshGame(oddValue);

    fs.writeFileSync(
      "previousStakeAmount.json",
      JSON.stringify(stakeAmount.toFixed(2), null, 2)
    );
  }

  // Put the stake amount in the input field
  const stakeInputSelector = '[data-testid="coupon-totals-stake-amount-value"]';
  const closeOdd = ".close-odd";
  const closeBetSlip = '[data-testid="coupon-continue-betting"]';

  await Promise.all([
    await page.waitForSelector(stakeInputSelector, { visible: true }),
    await page.focus(stakeInputSelector),
    await page.click(stakeInputSelector, { clickCount: 5, delay: 300 }), // Clear the input
    await page.type(stakeInputSelector, stakeAmount.toFixed(2)),

    // Step 6: Place the bet
    await page.waitForSelector(closeOdd),
    await page.click(closeOdd, { delay: 200 }),
    // Step 6: Place the bet
    await page.click(closeBetSlip),
  ]);
};

const calculationForFreshGame = (oddValue = 1.78) => {
  // const lastMatchPlayed = "L";
  const odd = oddValue - 1;
  const totalBanlance = 300000;
  const profitToMake = (totalBanlance / 100 / 10 / 2 / 2 / 3) * 2;
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
      let lastGamePlayed = JSON.parse(
        fs.readFileSync("lastgame.json", "utf-8")
      );

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
          const weeksLeft = 34 - currentWeek;

          if (weeksLeft <= 7 && lastGamePlayed === "W") {
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
          } else if (lastGamePlayed === "L" && weeksLeft <= 7) {
            await CheckAndPlaySelectedOption(
              page,
              gamesPlayed,
              teamsWithLastWin,
              filteredMatches
            );
          } else if (currentWeek >= 2 && weeksLeft >= 7) {
            await CheckAndPlaySelectedOption(
              page,
              gamesPlayed,
              teamsWithLastWin,
              filteredMatches
            );
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

const CheckAndPlaySelectedOption = async (
  page,
  gamesPlayed,
  teamsWithLastWin,
  filteredMatches
) => {
  if (gamesPlayed > 0) {
    gotoResults(page);
    await delay(6000);
    navigateTabs(page, "Standings");
    await delay(5000);
    await getTopTenTeams(page, teamsWithLastWin);
    await goToBackAndGotoOver2GoalsSelection(page);
    await compareSelectedTeams(page, filteredMatches);
    console.log("Checking last game played...");
  } else {
    await gotoTable(page);
    await delay(4000);
    await getTopTenTeams(page, teamsWithLastWin);
    await goToBackAndGotoOver2GoalsSelection(page);
    await compareSelectedTeams(page, filteredMatches);
  }
};
