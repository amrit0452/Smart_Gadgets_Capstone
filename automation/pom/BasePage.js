class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path) {
    const base = process.env.PW_BASE_URL || "http://localhost:3000";
    const url = new URL(path, base).toString(); // supports paths like "/Home.html"
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async expectVisible(selector) {
    await this.page.locator(selector).first().waitFor({ state: "visible", timeout: 10_000 });
  }

  async setLocalStorageToken(token) {
    // Must be set before page JS reads localStorage.
    await this.page.context().addInitScript((t) => {
      window.localStorage.setItem("token", t);
    }, token);
  }
}

module.exports = { BasePage };

