const { BasePage } = require("../BasePage");

class CartPage extends BasePage {
  async goto() {
    await super.goto("/Cart.html");
  }

  async waitForCart() {
    await this.page.locator("table.table").waitFor({ state: "visible", timeout: 15_000 });
  }

  async getSubtotal() {
    const txt = await this.page.locator("#subtotal").textContent();
    return txt;
  }

  async setQtyForProduct(productId, qty) {
    await this.page.locator(`#qty_${productId}`).fill(String(qty));
  }

  async clickUpdateForProduct(productId) {
    // Update button is in the same row; locate by row and click.
    const row = this.page.locator(`tr:has(#qty_${productId})`);
    await row.locator('button:has-text("Update")').click();
  }

  async clickRemoveForProduct(productId) {
    const row = this.page.locator(`tr:has(#qty_${productId})`);
    await row.locator('button:has-text("Remove")').click();
  }
}

module.exports = { CartPage };

