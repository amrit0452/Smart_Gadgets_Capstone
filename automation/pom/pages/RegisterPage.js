const { expect } = require("@playwright/test");
const { BasePage } = require("../BasePage");

class RegisterPage extends BasePage {
  async goto() {
    await super.goto("/Register.html");
  }

  async register(name, email, password) {
    await this.page.locator("#name").fill(name);
    await this.page.locator("#email").fill(email);
    await this.page.locator("#password").fill(password);
    await this.page.locator("form#registerForm").locator('button[type="submit"]').click();
  }

  async expectSuccess() {
    // Registration redirects to Login.html in current implementation.
    await this.page.waitForURL(/Login\.html/i, { timeout: 20_000 });
  }

  async expectErrorContains(text) {
    const msg = this.page.locator("#msg");
    await msg.waitFor({ state: "visible", timeout: 10_000 });
    await expect(msg).toHaveText(new RegExp(text, "i"));
  }
}

module.exports = { RegisterPage };

