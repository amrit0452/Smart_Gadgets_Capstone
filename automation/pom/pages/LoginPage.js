const { expect } = require("@playwright/test");
const { BasePage } = require("../BasePage");

class LoginPage extends BasePage {
  async goto() {
    await super.goto("/Login.html");
  }

  async login(email, password) {
    await this.page.locator("#email").fill(email);
    await this.page.locator("#password").fill(password);
    await this.page.locator("form#loginForm").locator('button[type="submit"]').click();
  }

  async expectErrorContains(text) {
    const msg = this.page.locator("#msg");
    await msg.waitFor({ state: "visible", timeout: 10_000 });
    await expect(msg).toHaveText(new RegExp(text, "i"));
  }
}

module.exports = { LoginPage };

