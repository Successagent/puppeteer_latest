import { delay } from "./delay.js";

export const clickWithHumanLikeMovement = async (page, selector) => {
  try {
    // Find the element using the selector
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found for selector: ${selector}`);
    }

    // Get the bounding box of the element
    const box = await element.boundingBox();
    if (!box) {
      throw new Error(
        `Element bounding box not found for selector: ${selector}`
      );
    }

    // Calculate a random point within the element
    const x = box.x + Math.random() * box.width;
    const y = box.y + Math.random() * box.height;

    // Move mouse to the element's position with smooth movement
    await page.mouse.move(x, y, { steps: 10 });
    await delay(100 + Math.random() * 200); // Randomized delay

    // Perform a click action
    await page.mouse.down();
    await delay(50 + Math.random() * 100); // Slight delay before release
    await page.mouse.up();

    // Random delay to simulate human interaction
    await delay(500 + Math.random() * 500);

    // Handle potential navigation triggered by the click
    const currentURL = page.url();
    await Promise.race([
      page
        .waitForNavigation({ waitUntil: "networkidle0", timeout: 5000 })
        .catch(() => {}),
      delay(2000), // Fallback wait in case navigation doesn't happen
    ]);

    // Check if navigation occurred
    if (page.url() !== currentURL) {
      console.log("Navigation occurred.");
    } else {
      console.log("No navigation occurred.");
    }
  } catch (e) {
    console.error(`Error clicking element: ${e.message}`);
  }
};

const humanTyping = async (page, text, selector, mode = "medium") => {
  try {
    // Define typing speed ranges
    const typingSpeeds = {
      fast: [20, 80], // 20-80ms delay per keystroke
      medium: [80, 150], // 80-150ms delay per keystroke
      slow: [150, 250], // 150-250ms delay per keystroke
    };
    const [minSpeed, maxSpeed] = typingSpeeds[mode] || typingSpeeds["medium"];

    // Find the input field using the selector
    const inputElement = await page.$(selector);
    if (!inputElement) {
      throw new Error(`Element not found for selector: ${selector}`);
    }

    // Focus on the input field before typing
    await inputElement.focus();

    // Function to generate a random integer between min and max

    // Type each character with a randomized delay
    for (let char of text) {
      await page.keyboard.type(char, {
        delay: getRandomInt(minSpeed, maxSpeed),
      });
    }

    // Optional: Add a final delay after typing to mimic natural behavior
    await delay(getRandomInt(500, 1000));

    console.log(`Successfully typed "${text}" into ${selector}`);
  } catch (e) {
    console.error(`Error typing text "${text}" into element "${selector}":`, e);
  }
};

export const pickTypeMode = async (page, text, selector) => {
  // Define available typing modes
  const modes = ["fast", "medium", "slow"];

  // Randomly select a typing mode
  const selectedMode = modes[getRandomInt(0, modes.length - 1)];
  console.log(`Selected typing mode: ${selectedMode}`);

  // Call the humanTyping function with the selected mode
  await humanTyping(page, text, selector, selectedMode);
};

export async function interactWithPage(page, timeOnPage) {
  return new Promise(async (resolve) => {
    let maxHeight = await page.evaluate(() =>
      document.documentElement ? document.documentElement.scrollHeight : 0
    );
    let currentHeight = 0;
    const startTime = Date.now();
    let currentMousePosition = { x: 100, y: 100 }; // Start position

    while (Date.now() - startTime < timeOnPage) {
      // Scroll randomly
      let scrollLength = getRandomInt(100, 5000);
      let direction = Math.random() < 0.5 ? -1 : 1;
      currentHeight += scrollLength * direction;
      currentHeight = Math.max(0, Math.min(currentHeight, maxHeight));

      await page.evaluate(
        (newHeight) => window.scrollTo(0, newHeight),
        currentHeight
      );

      let viewportWidth = await page.evaluate(() =>
        document.documentElement ? document.documentElement.clientWidth : 0
      );
      let viewportHeight = await page.evaluate(() =>
        document.documentElement ? document.documentElement.clientHeight : 0
      );

      // Choose a random movement pattern
      let pattern = getRandomInt(1, 8);
      await moveMouse(pattern, viewportWidth, viewportHeight, page);

      let delay = getRandomInt(500, 3000);
      await sleep(delay);

      // Occasionally scroll up
      if (Math.random() < 0.2) {
        let scrollUpLength = getRandomInt(100, 500);
        currentHeight = Math.max(0, currentHeight - scrollUpLength);
        await page.evaluate(
          (newHeight) => window.scrollTo(0, newHeight),
          currentHeight
        );
      }
    }
    resolve();
  });
}

async function moveMouse(pattern, viewportWidth, viewportHeight, page) {
  switch (pattern) {
    case 1: // Top to bottom
      await smoothMouseMove(0, viewportHeight / 2, false, page);
      break;
    case 2: // Left to right
      await smoothMouseMove(viewportWidth / 2, 0, false, page);
      break;
    case 3: // Diagonal
      await smoothMouseMove(viewportWidth / 2, viewportHeight / 2, false, page);
      break;
    case 4: // Reverse diagonal
      await smoothMouseMove(viewportWidth / 2, viewportHeight / 2, true, page);
      break;
    case 5: // Zigzag
      await zigzagMouseMove(viewportWidth, viewportHeight, page);
      break;
    case 6: // Circular
      await circularMouseMove(
        viewportWidth / 2,
        viewportHeight / 2,
        Math.min(viewportWidth, viewportHeight) / 8,
        page
      );
      break;
    case 7: // Random walk
      await randomWalk(viewportWidth, viewportHeight, page);
      break;
    case 8: // Spiral
      await spiralMouseMove(
        viewportWidth / 2,
        viewportHeight / 2,
        viewportWidth / 4,
        page
      );
      break;
  }
}

async function smoothMouseMove(targetX, targetY, reverse = false, page) {
  let steps = 100;
  let startX = 100;
  let startY = 100;
  for (let i = 0; i <= steps; i++) {
    let progress = reverse ? (steps - i) / steps : i / steps;
    let newX = startX + (targetX - startX) * progress;
    let newY = startY + (targetY - startY) * progress;
    await page.mouse.move(newX, newY);
    await sleep(getRandomInt(5, 15));
  }
}

async function zigzagMouseMove(viewportWidth, viewportHeight, page) {
  let steps = 10;
  let x = 100,
    y = 100;
  for (let i = 0; i < steps; i++) {
    x += viewportWidth / steps;
    y += (i % 2 === 0 ? 1 : -1) * (viewportHeight / steps);
    await page.mouse.move(x, y);
    await sleep(getRandomInt(5, 15));
  }
}

async function circularMouseMove(centerX, centerY, radius, page) {
  for (let i = 0; i < 360; i += 5) {
    let angle = (i * Math.PI) / 180;
    let newX = centerX + radius * Math.cos(angle);
    let newY = centerY + radius * Math.sin(angle);
    await page.mouse.move(newX, newY);
    await sleep(getRandomInt(5, 15));
  }
}

async function randomWalk(viewportWidth, viewportHeight, page) {
  let x = getRandomInt(100, viewportWidth - 100);
  let y = getRandomInt(100, viewportHeight - 100);
  for (let i = 0; i < 20; i++) {
    x += getRandomInt(-50, 50);
    y += getRandomInt(-50, 50);
    x = Math.max(0, Math.min(viewportWidth, x));
    y = Math.max(0, Math.min(viewportHeight, y));
    await page.mouse.move(x, y);
    await sleep(getRandomInt(10, 30));
  }
}

async function spiralMouseMove(centerX, centerY, maxRadius, page) {
  let radiusStep = maxRadius / 100;
  for (let i = 0; i <= 100; i++) {
    let angle = (i * Math.PI * 4) / 100;
    let radius = radiusStep * i;
    let newX = centerX + radius * Math.cos(angle);
    let newY = centerY + radius * Math.sin(angle);
    await page.mouse.move(newX, newY);
    await sleep(getRandomInt(5, 15));
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getFilteredLinks = async (page, keyword) => {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a")) // Select all links
      .map((a) => a.href); // Extract href attributes
  });
};
