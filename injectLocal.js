export const injectLocalStorage = async (page, storedData) => {
  // Inject localStorage before navigation
  await page.evaluateOnNewDocument((data) => {
    Object.keys(data).forEach((key) => {
      localStorage.setItem(key, data[key]);
    });
  }, storedData);
};
