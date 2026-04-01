const { expect } = require("@playwright/test");
const { BasePage } = require("../BasePage");

class OrdersPage extends BasePage {
  async goto() {
    await super.goto("/Orders.html");
  }

  async waitForOrders() {
    await this.page.locator("#ordersList .card").first().waitFor({ state: "visible", timeout: 15_000 });
  }

  async openFirstOrder() {
    await this.page.locator("#ordersList .card").first().click();
  }

  async cancelIfVisible() {
    const btn = this.page.locator('button:has-text("Cancel")');
    if (await btn.isVisible()) await btn.click();
  }

  async returnIfVisible() {
    const btn = this.page.locator('button:has-text("Return")');
    if (await btn.isVisible()) await btn.click();
  }

  async expectMessage(text) {
    const msg = this.page.locator("#msgBox");
    await msg.waitFor({ state: "visible", timeout: 10_000 });
    await expect(msg).toHaveText(new RegExp(text, "i"));
  }
}

module.exports = { OrdersPage };

