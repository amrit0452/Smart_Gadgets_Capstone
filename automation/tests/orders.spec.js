const { test, expect } = require("@playwright/test");
const { BASE_URL, authHeaders, loginSeedUser, createUserAndLogin, createOrderForUser } = require("./helpers/api");

async function listOrders(request, token) {
  const res = await request.get(`${BASE_URL}/api/orders`, { headers: authHeaders(token) });
  const json = await res.json();
  return { res, json };
}

test.describe("Orders: Cancel + Return", () => {
  test("orders list requires auth", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/orders`);
    expect(res.status()).toBe(401);
  });

  test("orders list returns array for authenticated user", async ({ request }) => {
    const token = await loginSeedUser(request, { email: "user1@example.com", password: "User@1234" });
    const { res, json } = await listOrders(request, token);
    expect(res.status()).toBe(200);
    expect(Array.isArray(json.orders)).toBe(true);
  });

  test("get seeded order by id success", async ({ request }) => {
    const token = await loginSeedUser(request, { email: "user1@example.com", password: "User@1234" });
    const res = await request.get(`${BASE_URL}/api/orders/201`, { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test("get missing order by id returns 404", async ({ request }) => {
    const token = await loginSeedUser(request, { email: "user1@example.com", password: "User@1234" });
    const res = await request.get(`${BASE_URL}/api/orders/999999`, { headers: authHeaders(token) });
    expect(res.status()).toBe(404);
  });

  test("cancel created order success", async ({ request }) => {
    const user = await createUserAndLogin(request, { prefix: "orders.cancel.ok" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    const res = await request.post(`${BASE_URL}/api/orders/${orderId}/cancel`, { headers: authHeaders(user.token) });
    expect(res.status()).toBe(200);
  });

  test("cancel already-cancelled order returns success", async ({ request }) => {
    const user = await createUserAndLogin(request, { prefix: "orders.cancel.twice" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    await request.post(`${BASE_URL}/api/orders/${orderId}/cancel`, { headers: authHeaders(user.token) });
    const res2 = await request.post(`${BASE_URL}/api/orders/${orderId}/cancel`, { headers: authHeaders(user.token) });
    expect(res2.status()).toBe(200);
  });

  test("cancel delivered seeded order rejected", async ({ request }) => {
    const token = await loginSeedUser(request, { email: "user1@example.com", password: "User@1234" });
    const res = await request.post(`${BASE_URL}/api/orders/202/cancel`, { headers: authHeaders(token) });
    expect(res.status()).toBe(409);
  });

  test("return delivered order success", async ({ request }) => {
    const admin = await loginSeedUser(request, { email: "admin@example.com", password: "Admin@1234" });
    const user = await createUserAndLogin(request, { prefix: "orders.return.ok" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    await request.post(`${BASE_URL}/api/admin/orders/${orderId}/mark-delivered`, { headers: authHeaders(admin) });
    const res = await request.post(`${BASE_URL}/api/orders/${orderId}/return`, { headers: authHeaders(user.token) });
    expect(res.status()).toBe(200);
  });

  test("return created order rejected", async ({ request }) => {
    const user = await createUserAndLogin(request, { prefix: "orders.return.created" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    const res = await request.post(`${BASE_URL}/api/orders/${orderId}/return`, { headers: authHeaders(user.token) });
    expect(res.status()).toBe(409);
  });

  test("return already-returned order returns success", async ({ request }) => {
    const admin = await loginSeedUser(request, { email: "admin@example.com", password: "Admin@1234" });
    const user = await createUserAndLogin(request, { prefix: "orders.return.twice" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    await request.post(`${BASE_URL}/api/admin/orders/${orderId}/mark-delivered`, { headers: authHeaders(admin) });
    await request.post(`${BASE_URL}/api/orders/${orderId}/return`, { headers: authHeaders(user.token) });
    const res2 = await request.post(`${BASE_URL}/api/orders/${orderId}/return`, { headers: authHeaders(user.token) });
    expect(res2.status()).toBe(200);
  });

  test("cancel unknown order returns 404", async ({ request }) => {
    const user = await createUserAndLogin(request, { prefix: "orders.cancel.404" });
    const res = await request.post(`${BASE_URL}/api/orders/999999/cancel`, { headers: authHeaders(user.token) });
    expect(res.status()).toBe(404);
  });

  test("return unknown order returns 404", async ({ request }) => {
    const user = await createUserAndLogin(request, { prefix: "orders.return.404" });
    const res = await request.post(`${BASE_URL}/api/orders/999999/return`, { headers: authHeaders(user.token) });
    expect(res.status()).toBe(404);
  });

  test("cancel changes order status to CANCELLED", async ({ request }) => {
    const user = await createUserAndLogin(request, { prefix: "orders.cancel.status" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    await request.post(`${BASE_URL}/api/orders/${orderId}/cancel`, { headers: authHeaders(user.token) });
    const { json } = await listOrders(request, user.token);
    const order = (json.orders || []).find((o) => Number(o.order_id) === Number(orderId));
    expect(order.order_status).toBe("CANCELLED");
  });

  test("return changes order status to RETURNED", async ({ request }) => {
    const admin = await loginSeedUser(request, { email: "admin@example.com", password: "Admin@1234" });
    const user = await createUserAndLogin(request, { prefix: "orders.return.status" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    await request.post(`${BASE_URL}/api/admin/orders/${orderId}/mark-delivered`, { headers: authHeaders(admin) });
    await request.post(`${BASE_URL}/api/orders/${orderId}/return`, { headers: authHeaders(user.token) });
    const { json } = await listOrders(request, user.token);
    const order = (json.orders || []).find((o) => Number(o.order_id) === Number(orderId));
    expect(order.order_status).toBe("RETURNED");
  });

  test("order details endpoint shape includes items", async ({ request }) => {
    const token = await loginSeedUser(request, { email: "user1@example.com", password: "User@1234" });
    const res = await request.get(`${BASE_URL}/api/orders/201`, { headers: authHeaders(token) });
    const json = await res.json();
    expect(json.order).toBeTruthy();
    expect(Array.isArray(json.order.items)).toBe(true);
  });
});

