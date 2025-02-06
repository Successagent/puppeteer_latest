// utils/cookies.js
import fs from "fs";

export const saveCookies = async (page, filePath = "cookies.json") => {
  const cookies = await page.cookies();
  fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
};

export const loadCookies = async (page, filePath = "cookies.json") => {
  if (!fs.existsSync(filePath)) return;
  const cookies = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  await page.setCookie(...cookies);
};
