import fs from "fs";

export const getTopTenTeams = async (page, teamsWithLastWin) => {
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
  await delay(3000);
};

export const gotoTable = async (page) => {
  const hamburger = ".view-switch-icon";
  await page.waitForSelector(hamburger);
  await page.click(hamburger);

  await delay(3000);
  console.log("Table is now visible");
};

export const goToBackAndGotoOver2GoalsSelection = async (page) => {
  const backButton = ".close-icon";
  await page.waitForSelector(backButton);
  await page.click(backButton);

  await delay(2000);
  console.log("Navigated back");

  const over2Market = '[data-testid="o/u-2.5-market"]';
  await page.waitForSelector(over2Market);
  await page.click(over2Market);

  console.log("Over 2 Goals Market is now visible");
  await delay(3000);
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

  filteredMatches = results.slice(0, 8).filter((game) => {
    const [team1, team2] = game.matchup
      .split(" vs ")
      .map((team) => team.trim());
    return teamList.includes(team1) || teamList.includes(team2);
  });

  fs.writeFileSync(
    "filteredMatches.json",
    JSON.stringify(filteredMatches, null, 2)
  );
  await delay(2000);
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

  console.log(`Selected game to click: ${result.matchup}`);
  fs.unlinkSync("filteredMatches.json");
  fs.unlinkSync("teamsWithLastWin.json");

  await delay(3500);

  //   // Step 2: Click on the "over" option for that game
  //   await page.evaluate((matchup) => {
  //     const games = Array.from(document.querySelectorAll(".match")); // adjust selector

  //     for (const game of games) {
  //       const team1 = game.querySelector(".home-team").textContent.trim();
  //       const team2 = game.querySelector(".away-team").textContent.trim();

  //       if (`${team1} vs ${team2}` === matchup) {
  //         const overButton = game.querySelector(
  //           '[data-testid="match-odd-value"]'
  //         )[0]; // adjust selector
  //         if (overButton) {
  //           overButton.click();
  //           console.log(`Clicked on over for: ${matchup}`);
  //         }
  //         break;
  //       }
  //     }
  //   }, result.matchup);
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

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
