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
    const getRandomInt = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

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

  // Function to generate a random integer between min and max (inclusive)
  const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // Randomly select a typing mode
  const selectedMode = modes[getRandomInt(0, modes.length - 1)];
  console.log(`Selected typing mode: ${selectedMode}`);

  // Call the humanTyping function with the selected mode
  await humanTyping(page, text, selector, selectedMode);
};
