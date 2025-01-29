async function preventNewTabs(page) {
  // Remove target="_blank" from all <a> tags
  await page.evaluate(() => {
    document
      .querySelectorAll("a")
      .forEach((link) => link.removeAttribute("target"));
  });

  // Override window.open() to stay in the same tab
  await page.evaluate(() => {
    window.open = function (url) {
      location.href = url; // Redirect in the same tab
    };
  });

  // Modify onclick handlers to prevent new tab opening
  await page.evaluate(() => {
    document.querySelectorAll("[onclick]").forEach((el) => {
      const onclickAttr = el.getAttribute("onclick");
      if (onclickAttr && onclickAttr.includes("window.open")) {
        el.setAttribute(
          "onclick",
          onclickAttr.replace("window.open", "window.location.href=")
        );
      }
    });
  });
}

module.exports = { preventNewTabs };
