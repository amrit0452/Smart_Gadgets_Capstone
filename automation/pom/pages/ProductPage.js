const { BasePage } = require("../BasePage");

class ProductPage extends BasePage {
  async gotoProduct(id) {
    await super.goto(`/Product.html?id=${id}`);
  }

  async expectStockAvailable() {
    await this.page.locator("#stockInfo").waitFor({ state: "visible" });
    await this.page.locator("#addToCartBtn").waitFor({ state: "attached" });
  }

  async addToCart(qty = 1) {
    await this.page.locator("#qty").fill(String(qty));
    await this.page.locator("#addToCartBtn").click();
    // Product.html triggers redirect to Cart on success.
    await this.page.waitForURL(/Cart\.html/i, { timeout: 10_000 });
  }

  async expectReviewListMinCount(n = 0) {
    const cards = this.page.locator("#reviewsList .card");
    await cards.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    const count = await cards.count();
    if (n > 0) {
      if (count < n) throw new Error(`Expected at least ${n} review cards, got ${count}`);
    }
  }

  async submitReview({ rating, reviewText }) {
    await this.page.locator("#rating").selectOption(String(rating));
    await this.page.locator("#reviewText").fill(reviewText);
    await this.page.locator("#reviewForm button[type=\"submit\"],#submitReviewBtn").click();
  }
}

module.exports = { ProductPage };

