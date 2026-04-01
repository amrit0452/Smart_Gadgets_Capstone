const { expect } = require("@playwright/test");
const { BasePage } = require("../BasePage");

class CheckoutPage extends BasePage {
  async goto() {
    await super.goto("/Checkout.html");
  }

  async fillAddress({ line1, city, state, zip, country }) {
    await this.page.locator("#line1").fill(line1);
    await this.page.locator("#city").fill(city);
    await this.page.locator("#state").fill(state);
    await this.page.locator("#zip").fill(zip);
    await this.page.locator("#country").fill(country);
  }

  async choosePaymentMethod(method) {
    await this.page.locator("#paymentMethod").selectOption(method);
    await this.page.evaluate((selectedMethod) => {
      const card = document.getElementById("paymentCardFields");
      const upi = document.getElementById("paymentUPIFields");
      if (!card || !upi) return;
      card.style.display = selectedMethod === "UPI" ? "none" : "block";
      upi.style.display = selectedMethod === "UPI" ? "block" : "none";
    }, method);
    if (method === "UPI") {
      await this.page.locator("#paymentUPIFields").waitFor({ state: "visible", timeout: 10_000 });
    } else {
      await this.page.locator("#paymentCardFields").waitFor({ state: "visible", timeout: 10_000 });
    }
  }

  async fillCard({ cardNumber, expiry, cvv }) {
    await this.page.locator("#cardNumber").fill(cardNumber);
    await this.page.locator("#expiry").fill(expiry);
    await this.page.locator("#cvv").fill(cvv);
  }

  async fillUPI(upiId) {
    const upi = this.page.locator("#upiId");
    await upi.waitFor({ state: "visible", timeout: 10_000 });
    await upi.fill(upiId);
  }

  async placeOrder() {
    await this.page.locator("#placeOrderBtn").click();
  }

  async expectMessageContains(text) {
    const msg = this.page.locator("#msgBox");
    await msg.waitFor({ state: "visible", timeout: 10_000 });
    await expect(msg).toHaveText(new RegExp(text, "i"));
  }
}

module.exports = { CheckoutPage };

