import puppeteer from "puppeteer";
import { interactWithPage } from "./actions.js";

const randomNumber = Math.floor(Math.random() * 3);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("https://astromovies.vercel.app/movies/moana-part-2");

  await interactWithPage(page, 30000);
  const linkSelector = `#root > section > section > div.movie_section_img > ul > li:nth-child(${
    randomNumber === 0 ? 1 : randomNumber
  }) > a`;
  await page.click(linkSelector);

  await interactWithPage(page, 20000);

  await browser.close();
})();
