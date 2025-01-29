const axios = require("axios"); // Ensure axios is imported
const UserAgent = require("user-agents");
const { Cluster } = require("puppeteer-cluster");

async function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

class HumanBehavior {
  static async randomMouseMovement(page) {
    const viewport = page.viewport();
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * viewport.width;
      const y = Math.random() * viewport.height;
      await page.mouse.move(x, y, {
        steps: Math.floor(Math.random() * 20) + 5,
      });
      await delay(Math.random() * 1000 + 500);
    }
  }

  static async humanType(page, element, text) {
    for (const char of text) {
      await element.type(char, { delay: Math.random() * 100 + 50 });
      if (Math.random() > 0.95) await delay(500); // Random pause
    }
  }
}

// Generate a random viewport size
function getRandomViewport() {
  const width = Math.floor(Math.random() * (1560 - 1024)) + 1024; // Width between 1024 and 2560
  const height = Math.floor(Math.random() * (1000 - 768)) + 768; // Height between 768 and 1440
  return { width, height };
}

const randomViewports = [
  {
    width: 360,
    height: 640,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  }, // Common Android
  {
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  }, // iPhone X/11 Pro
  {
    width: 414,
    height: 896,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  }, // iPhone XR/11
  {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  }, // Pixel 7
  {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  }, // iPhone 12/13/14
  {
    width: 412,
    height: 869,
    deviceScaleFactor: 2.25,
    isMobile: true,
    hasTouch: true,
  }, // Galaxy S20
  {
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  }, // iPhone 14 Pro
  {
    width: 430,
    height: 932,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  }, // iPhone 14 Pro Max
  {
    width: 360,
    height: 780,
    deviceScaleFactor: 2.5,
    isMobile: true,
    hasTouch: true,
  }, // Samsung Galaxy S22
  {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  }, // iPhone SE (2nd Gen)
];

function getRandomMobileViewport() {
  return randomViewports[Math.floor(Math.random() * randomViewports.length)];
}

const userAgent = new UserAgent({ deviceCategory: "desktop" });
const randomViewport = getRandomViewport();

let index = 0;

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 1,
    puppeteerOptions: {
      headless: false,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      // userDataDir: "C:/Users/HP/AppData/Local/Google/Chrome/User Data",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        `--user-agent=${userAgent.toString()}`,
      ],
      defaultViewport: randomViewport,
    },
  });

  await cluster.task(async ({ page, data: url }) => {
    const waitForViggetteBanner = async () => {
      // const selector = "#blog_item_0";
      // await page.click(selector);
      // await delay(3000 + Math.random() * 5000); // Random delay
      // await page.click(
      //   "#root > div.update_news_item > div.related_news_sect_wrapper > a"
      // );
      // await delay(4000 + Math.random() * 10000); // Random delay
    };

    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
    console.log(`Task done ${index++}`);

    await HumanBehavior.randomMouseMovement(page);
    console.log(`Mouse Moved`);

    // await new Promise.all([await waitForViggetteBanner()]);
    await delay(70000);
  });

  // cluster.queue("https://bot.sannysoft.com");
  // cluster.queue("https://bot.sannysoft.com");
  // cluster.queue("https://www.google.com/");
  // cluster.queue("https://www.google.com/");
  // cluster.queue("https://spdload.com/blog/what-is-saas-product/");
  // cluster.queue("https://spdload.com/blog/what-is-saas-product/");

  // Function to continuously add tasks to the cluster
  const addTasksContinuously = () => {
    setInterval(async () => {
      cluster.queue("https://www.whatismybrowser.com/");
    }, 10000); // Interval in milliseconds (e.g., 10 seconds)
  };

  // Start adding tasks to the cluster continuously
  addTasksContinuously();

  const gracefulShutdown = async () => {
    console.log("Shutting down...");
    await cluster.idle();
    await cluster.close();
    process.exit(0);
  };

  // Handle SIGINT signal (Ctrl+C)
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
})();
