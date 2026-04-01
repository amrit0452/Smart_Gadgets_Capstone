const { expect } = require("@playwright/test");
const { BasePage } = require("../BasePage");

class AdminProductsPage extends BasePage {
  async goto() {
    await super.goto("/AdminProducts.html");
  }

  async waitForCategories() {
    await this.page.locator("#c_categoryId").first().waitFor({ state: "visible", timeout: 15_000 });
  }

  async createProduct(product) {
    await this.page.locator("#c_categoryId").selectOption(String(product.categoryId));
    await this.page.locator("#c_name").fill(product.name);
    await this.page.locator("#c_brand").fill(product.brand);
    await this.page.locator("#c_description").fill(product.description || "");
    await this.page.locator("#c_price").fill(String(product.price));
    await this.page.locator("#c_stockQuantity").fill(String(product.stockQuantity));
    await this.page.locator("#c_isAvailable").selectOption(String(product.isAvailable ? 1 : 0));
    const imgs = Array.isArray(product.imageUrls) ? product.imageUrls.join(",") : product.imageUrls || "";
    await this.page.locator("#c_imageUrls").fill(String(imgs));
    await this.page.locator("#createForm button[type=\"submit\"],#createForm button").first().click();
  }

  async expectMessageContains(text) {
    const msg = this.page.locator("#msgBox");
    await msg.waitFor({ state: "visible", timeout: 15_000 });
    await expect(msg).toHaveText(new RegExp(text, "i"));
  }
}

module.exports = { AdminProductsPage };

