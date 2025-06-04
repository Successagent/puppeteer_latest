import fs from "fs";
import nodemailer from "nodemailer";

export const getTopTenTeams = async (page, teamsWithLastWin) => {
  await delay(3000);
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
  console.log(`Selected game to click: ${result.matchup}`);
  fs.unlinkSync("filteredMatches.json");
  fs.unlinkSync("teamsWithLastWin.json");

  // Step 3: Click on the selected game

  const [homeTeam, awayTeam] = result.matchup.split(" vs ");

  const matches = await page.$$(".match");

  for (const match of matches.slice(0, 9)) {
    // Get the home and away team names from the match row
    const matchText = await match.evaluate((el) => el.innerText);

    if (matchText.includes(homeTeam) && matchText.includes(awayTeam)) {
      // Click the Over 2.5 button inside this match row
      const over2Button = await match.$('[data-testid="match-odd-value"]'); // Adjust selector
      if (over2Button) {
        await over2Button.click();
        console.log("Clicked Over 2.5 for this match.");
      } else {
        console.log("Over 2.5 button not found.");
      }
    }
  }
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

export async function trackTimerValue(
  page,
  teamsWithLastWin,
  filteredMatches,
  browser,
  lastGamePlayed = "W"
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

        if (timerValue === "00:50") {
          const elementText = await page.$eval(".week", (el) => el.textContent);
          const match = elementText.match(/\d+/); // Extracts the first sequence of digits
          const number = match ? parseInt(match[0], 10) : null;
          if (34 - 1 < 8 && lastGamePlayed === "W") {
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
              html: `<p>Week is less than 8, stopping the script.</p><p>Current week: ${number}</p>`,
            };
            transport.sendMail(adminMailOptions, (error, info) => {
              if (error) {
                console.log(error);
              } else {
                console.log("Admin email sent: " + info.response);
              }
            });
            await page.close(); // Closes the current page
            browser.close(); // Stop the script if week is less than 8
          } else {
            await gotoTable(page);
            await getTopTenTeams(page, teamsWithLastWin);
            await goToBackAndGotoOver2GoalsSelection(page);
            await compareSelectedTeams(page, filteredMatches);
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
