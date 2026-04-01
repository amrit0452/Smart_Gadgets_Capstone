const { test, expect } = require("@playwright/test");
const { BASE_URL, authHeaders, createUserAndLogin, addCartItem, placeCheckout } = require("./helpers/api");

const baseAddress = {
  line1: "221B Baker Street",
  city: "London",
  state: "LDN",
  zip: "12345",
  country: "UK",
};

async function userWithCart(request, prefix = "checkout.user", productId = 104) {
  const { token } = await createUserAndLogin(request, { prefix });
  await addCartItem(request, token, { productId, quantity: 1 });
  return token;
}

test.describe("Checkout + Payment Simulation", () => {
  test("credit payment success", async ({ request }) => {
    const token = await userWithCart(request, "checkout.credit.ok");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "CREDIT",
      cardNumber: "4111111111111111",
      expiry: "12/2099",
      cvv: "123",
    });
    expect(res.status()).toBe(201);
  });

  test("debit payment success", async ({ request }) => {
    const token = await userWithCart(request, "checkout.debit.ok");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "DEBIT",
      cardNumber: "4012888888881881",
      expiry: "12/2099",
      cvv: "123",
    });
    expect(res.status()).toBe(201);
  });

  test("invalid card fails with 402", async ({ request }) => {
    const token = await userWithCart(request, "checkout.card.bad");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "CREDIT",
      cardNumber: "4111111111111112",
      expiry: "12/2099",
      cvv: "123",
    });
    expect(res.status()).toBe(402);
  });

  test("insufficient funds simulated by 0000 suffix", async ({ request }) => {
    const token = await userWithCart(request, "checkout.card.funds");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "CREDIT",
      cardNumber: "9911761725750000",
      expiry: "12/2099",
      cvv: "123",
    });
    expect(res.status()).toBe(402);
    const json = await res.json();
    expect(json.error.reason).toBe("INSUFFICIENT_FUNDS");
  });

  test("expired card fails", async ({ request }) => {
    const token = await userWithCart(request, "checkout.card.expired");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "CREDIT",
      cardNumber: "4111111111111111",
      expiry: "01/2001",
      cvv: "123",
    });
    expect(res.status()).toBe(402);
  });

  test("missing card number for credit rejected by validator", async ({ request }) => {
    const token = await userWithCart(request, "checkout.card.missing");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "CREDIT",
      expiry: "12/2099",
      cvv: "123",
    });
    expect(res.status()).toBe(400);
  });

  test("valid UPI success", async ({ request }) => {
    const token = await userWithCart(request, "checkout.upi.ok");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "UPI",
      upiId: "amrit@upi",
    });
    expect(res.status()).toBe(201);
  });

  test("invalid UPI provider fails", async ({ request }) => {
    const token = await userWithCart(request, "checkout.upi.bad");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "UPI",
      upiId: "amrit@unknownbank",
    });
    expect(res.status()).toBe(402);
  });

  test("missing upiId rejected by validator", async ({ request }) => {
    const token = await userWithCart(request, "checkout.upi.missing");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "UPI",
    });
    expect(res.status()).toBe(400);
  });

  test("invalid payment method rejected", async ({ request }) => {
    const token = await userWithCart(request, "checkout.method.bad");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "CASH",
    });
    expect(res.status()).toBe(400);
  });

  test("checkout with empty cart returns 400", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "checkout.empty" });
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "UPI",
      upiId: "amrit@upi",
    });
    expect(res.status()).toBe(400);
  });

  test("missing address line1 rejected", async ({ request }) => {
    const token = await userWithCart(request, "checkout.addr.line1");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      line1: "",
      paymentMethod: "UPI",
      upiId: "amrit@upi",
    });
    expect(res.status()).toBe(400);
  });

  test("unauthorized checkout rejected", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/checkout/place`, {
      headers: { "Content-Type": "application/json" },
      data: { ...baseAddress, paymentMethod: "UPI", upiId: "amrit@upi" },
    });
    expect(res.status()).toBe(401);
  });

  test("success response includes order id", async ({ request }) => {
    const token = await userWithCart(request, "checkout.orderid");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "UPI",
      upiId: "amrit@upi",
    });
    const json = await res.json();
    expect(res.status()).toBe(201);
    expect(json.orderId).toBeTruthy();
  });

  test("cart is cleared after successful checkout", async ({ request }) => {
    const token = await userWithCart(request, "checkout.clear");
    const res = await placeCheckout(request, token, {
      ...baseAddress,
      paymentMethod: "CREDIT",
      cardNumber: "4111111111111111",
      expiry: "12/2099",
      cvv: "123",
    });
    expect(res.status()).toBe(201);
    const summaryRes = await request.get(`${BASE_URL}/api/cart/summary`, { headers: authHeaders(token) });
    const summaryJson = await summaryRes.json();
    expect(summaryJson.items.length).toBe(0);
  });
});

