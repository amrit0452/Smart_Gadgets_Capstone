const { test, expect } = require("@playwright/test");
const { BASE_URL, authHeaders, createUserAndLogin } = require("./helpers/api");

async function cartSummary(request, token) {
  const res = await request.get(`${BASE_URL}/api/cart/summary`, { headers: authHeaders(token) });
  const json = await res.json();
  return { res, json };
}

test.describe("Shopping Cart", () => {
  test("cart summary for new user is empty", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.empty" });
    const { res, json } = await cartSummary(request, token);
    expect(res.status()).toBe(200);
    expect(json.items.length).toBe(0);
  });

  test("add item to cart succeeds", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.add.ok" });
    const res = await request.post(`${BASE_URL}/api/cart/items`, {
      headers: authHeaders(token),
      data: { productId: 101, quantity: 1 },
    });
    expect(res.status()).toBe(200);
  });

  test("adding same item increments quantity", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.add.twice" });
    await request.post(`${BASE_URL}/api/cart/items`, { headers: authHeaders(token), data: { productId: 101, quantity: 1 } });
    await request.post(`${BASE_URL}/api/cart/items`, { headers: authHeaders(token), data: { productId: 101, quantity: 2 } });
    const { json } = await cartSummary(request, token);
    const item = json.items.find((x) => Number(x.productId) === 101);
    expect(Number(item.quantity)).toBe(3);
  });

  test("add invalid quantity is rejected", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.add.badqty" });
    const res = await request.post(`${BASE_URL}/api/cart/items`, {
      headers: authHeaders(token),
      data: { productId: 101, quantity: 0 },
    });
    expect(res.status()).toBe(400);
  });

  test("add unknown product returns 404", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.add.404" });
    const res = await request.post(`${BASE_URL}/api/cart/items`, {
      headers: authHeaders(token),
      data: { productId: 999999, quantity: 1 },
    });
    expect(res.status()).toBe(404);
  });

  test("add out-of-stock product returns 409", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.add.oos" });
    const res = await request.post(`${BASE_URL}/api/cart/items`, {
      headers: authHeaders(token),
      data: { productId: 102, quantity: 1 },
    });
    expect(res.status()).toBe(409);
  });

  test("update quantity succeeds", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.patch.ok" });
    await request.post(`${BASE_URL}/api/cart/items`, { headers: authHeaders(token), data: { productId: 101, quantity: 1 } });
    const res = await request.patch(`${BASE_URL}/api/cart/items/101`, {
      headers: authHeaders(token),
      data: { quantity: 2 },
    });
    expect(res.status()).toBe(200);
  });

  test("update quantity to zero removes item", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.patch.zero" });
    await request.post(`${BASE_URL}/api/cart/items`, { headers: authHeaders(token), data: { productId: 101, quantity: 1 } });
    await request.patch(`${BASE_URL}/api/cart/items/101`, { headers: authHeaders(token), data: { quantity: 0 } });
    const { json } = await cartSummary(request, token);
    expect(json.items.find((x) => Number(x.productId) === 101)).toBeFalsy();
  });

  test("update overly large quantity is rejected", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.patch.stock" });
    await request.post(`${BASE_URL}/api/cart/items`, { headers: authHeaders(token), data: { productId: 106, quantity: 1 } });
    const res = await request.patch(`${BASE_URL}/api/cart/items/106`, {
      headers: authHeaders(token),
      data: { quantity: 20000 },
    });
    expect(res.status()).toBe(400);
  });

  test("update with invalid quantity rejected", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.patch.badqty" });
    const res = await request.patch(`${BASE_URL}/api/cart/items/101`, {
      headers: authHeaders(token),
      data: { quantity: "abc" },
    });
    expect(res.status()).toBe(400);
  });

  test("update non-existing product returns 404", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.patch.404" });
    const res = await request.patch(`${BASE_URL}/api/cart/items/999999`, {
      headers: authHeaders(token),
      data: { quantity: 1 },
    });
    expect(res.status()).toBe(404);
  });

  test("remove existing item succeeds", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.del.ok" });
    await request.post(`${BASE_URL}/api/cart/items`, { headers: authHeaders(token), data: { productId: 101, quantity: 1 } });
    const delRes = await request.delete(`${BASE_URL}/api/cart/items/101`, { headers: authHeaders(token) });
    expect(delRes.status()).toBe(200);
  });

  test("remove missing item still succeeds", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.del.missing" });
    const delRes = await request.delete(`${BASE_URL}/api/cart/items/101`, { headers: authHeaders(token) });
    expect(delRes.status()).toBe(200);
  });

  test("summary includes subtotal and total", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "cart.summary.total" });
    await request.post(`${BASE_URL}/api/cart/items`, { headers: authHeaders(token), data: { productId: 101, quantity: 1 } });
    const { json } = await cartSummary(request, token);
    expect(json.subtotal).toBeDefined();
    expect(json.total).toBeDefined();
  });

  test("cart endpoints require auth", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/cart/items`, {
      headers: { "Content-Type": "application/json" },
      data: { productId: 101, quantity: 1 },
    });
    expect(res.status()).toBe(401);
  });
});

