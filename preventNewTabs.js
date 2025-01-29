async function preventNewTabs(page) {
  await page.evaluateOnNewDocument(() => {
    // Override window.open to stay in the same tab
    window.open = function (url, target, features) {
      location.href = url;
    };

    // Ensure target="_blank" links open in the same tab
    document.addEventListener("click", (event) => {
      const element = event.target.closest('a[target="_blank"]');
      if (element) {
        event.preventDefault();
        location.href = element.href;
      }
    });
  });
}

module.exports = { preventNewTabs };
