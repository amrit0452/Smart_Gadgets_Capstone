const { expect } = require("@playwright/test");

async function waitForText(page, selector, text) {
  const loc = page.locator(selector);
  await loc.waitFor({ state: "visible" });
  await expect(loc).toHaveText(text, { timeout: 10_000 });
}

module.exports = { waitForText };

