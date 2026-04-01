const { BasePage } = require("../BasePage");

class HomePage extends BasePage {
  async goto() {
    await super.goto("/Home.html");
  }

  async waitForProductCards() {
    await this.page.locator("#productsGrid .product-card").first().waitFor({ state: "visible", timeout: 15_000 });
  }

  async search(query) {
    await this.page.locator("#search").fill(query);
    await this.page.locator("#filterForm button[type=\"submit\"]").click();
  }

  async setFilters({ brand, availability, minPrice, maxPrice, minRating, sort, categoryId }) {
    if (brand !== undefined) await this.page.locator("#brand").selectOption(brand ? brand : "");
    if (availability !== undefined) await this.page.locator("#availability").selectOption(availability ? availability : "");
    if (minPrice !== undefined) await this.page.locator("#minPrice").fill(String(minPrice));
    if (maxPrice !== undefined) await this.page.locator("#maxPrice").fill(String(maxPrice));
    if (minRating !== undefined) await this.page.locator("#minRating").fill(String(minRating));
    if (sort !== undefined) await this.page.locator("#sort").selectOption(sort);
    if (categoryId !== undefined) await this.page.locator("#category_id").selectOption(categoryId ? String(categoryId) : "");
    await this.page.locator("#filterForm button[type=\"submit\"]").click();
  }

  async openFirstProduct() {
    const link = this.page.locator('#productsGrid a[href*="Product.html?id"]').first();
    await link.click();
  }
}

module.exports = { HomePage };

