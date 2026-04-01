const { test, expect } = require("@playwright/test");
const { uniqueId } = require("./helpers/unique");
const { BASE_URL, authHeaders, loginSeedUser, createUserAndLogin, createOrderForUser } = require("./helpers/api");

async function adminToken(request) {
  return loginSeedUser(request, { email: "admin@example.com", password: "Admin@1234" });
}

async function createProduct(request, token, suffix = "x") {
  const payload = {
    categoryId: 3,
    name: `Admin Product ${suffix} ${uniqueId()}`,
    brand: "Orbit",
    description: "Admin created product",
    price: 49.99,
    stockQuantity: 10,
    isAvailable: 1,
    imageUrls: ["/images/cable1.svg"],
  };
  const res = await request.post(`${BASE_URL}/api/admin/products`, {
    headers: authHeaders(token),
    data: payload,
  });
  const json = await res.json();
  return { res, json, payload };
}

test.describe("Admin Dashboard", () => {
  test("admin create product success", async ({ request }) => {
    const token = await adminToken(request);
    const { res, json } = await createProduct(request, token, "create");
    expect(res.status()).toBe(201);
    expect(json.productId).toBeTruthy();
  });

  test("admin update product success", async ({ request }) => {
    const token = await adminToken(request);
    const created = await createProduct(request, token, "update");
    const productId = created.json.productId;
    const res = await request.put(`${BASE_URL}/api/admin/products/${productId}`, {
      headers: authHeaders(token),
      data: { ...created.payload, name: `${created.payload.name} Updated` },
    });
    expect(res.status()).toBe(200);
  });

  test("admin delete product success", async ({ request }) => {
    const token = await adminToken(request);
    const created = await createProduct(request, token, "delete");
    const delRes = await request.delete(`${BASE_URL}/api/admin/products/${created.json.productId}`, {
      headers: authHeaders(token),
    });
    expect(delRes.status()).toBe(200);
  });

  test("admin list users success", async ({ request }) => {
    const token = await adminToken(request);
    const res = await request.get(`${BASE_URL}/api/admin/users`, { headers: authHeaders(token) });
    const json = await res.json();
    expect(res.status()).toBe(200);
    expect(Array.isArray(json.users)).toBe(true);
  });

  test("admin disable and re-enable user", async ({ request }) => {
    const token = await adminToken(request);
    const usersRes = await request.get(`${BASE_URL}/api/admin/users`, { headers: authHeaders(token) });
    const usersJson = await usersRes.json();
    const user = (usersJson.users || []).find((u) => u.email === "user2@example.com");
    expect(user).toBeTruthy();
    const disableRes = await request.patch(`${BASE_URL}/api/admin/users/${user.user_id}`, {
      headers: authHeaders(token),
      data: { isActive: 0 },
    });
    expect(disableRes.status()).toBe(200);
    const enableRes = await request.patch(`${BASE_URL}/api/admin/users/${user.user_id}`, {
      headers: authHeaders(token),
      data: { isActive: 1 },
    });
    expect(enableRes.status()).toBe(200);
  });

  test("admin list orders success", async ({ request }) => {
    const token = await adminToken(request);
    const res = await request.get(`${BASE_URL}/api/admin/orders`, { headers: authHeaders(token) });
    const json = await res.json();
    expect(res.status()).toBe(200);
    expect(Array.isArray(json.orders)).toBe(true);
  });

  test("admin mark-delivered succeeds for created order", async ({ request }) => {
    const token = await adminToken(request);
    const user = await createUserAndLogin(request, { prefix: "admin.markdel.user" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    const res = await request.post(`${BASE_URL}/api/admin/orders/${orderId}/mark-delivered`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
  });

  test("admin mark-delivered 404 for unknown order", async ({ request }) => {
    const token = await adminToken(request);
    const res = await request.post(`${BASE_URL}/api/admin/orders/999999/mark-delivered`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(404);
  });

  test("admin cancel created order succeeds", async ({ request }) => {
    const token = await adminToken(request);
    const user = await createUserAndLogin(request, { prefix: "admin.cancel.user" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    const res = await request.post(`${BASE_URL}/api/admin/orders/${orderId}/cancel`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(200);
  });

  test("admin cancel already cancelled order returns success", async ({ request }) => {
    const token = await adminToken(request);
    const user = await createUserAndLogin(request, { prefix: "admin.cancel.twice.user" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    await request.post(`${BASE_URL}/api/admin/orders/${orderId}/cancel`, { headers: authHeaders(token) });
    const res2 = await request.post(`${BASE_URL}/api/admin/orders/${orderId}/cancel`, { headers: authHeaders(token) });
    expect(res2.status()).toBe(200);
  });

  test("admin return on non-delivered order is rejected", async ({ request }) => {
    const token = await adminToken(request);
    const user = await createUserAndLogin(request, { prefix: "admin.return.created" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    const res = await request.post(`${BASE_URL}/api/admin/orders/${orderId}/return`, {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(409);
  });

  test("admin return delivered order succeeds", async ({ request }) => {
    const token = await adminToken(request);
    const user = await createUserAndLogin(request, { prefix: "admin.return.delivered" });
    const orderId = await createOrderForUser(request, user.token, { productId: 104, quantity: 1 });
    await request.post(`${BASE_URL}/api/admin/orders/${orderId}/mark-delivered`, { headers: authHeaders(token) });
    const res = await request.post(`${BASE_URL}/api/admin/orders/${orderId}/return`, { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
  });

  test("admin revenue endpoint works", async ({ request }) => {
    const token = await adminToken(request);
    const res = await request.get(`${BASE_URL}/api/admin/revenue`, { headers: authHeaders(token) });
    const json = await res.json();
    expect(res.status()).toBe(200);
    expect(Array.isArray(json.revenue)).toBe(true);
  });

  test("non-admin cannot access admin users endpoint", async ({ request }) => {
    const userToken = await loginSeedUser(request, { email: "user1@example.com", password: "User@1234" });
    const res = await request.get(`${BASE_URL}/api/admin/users`, { headers: authHeaders(userToken) });
    expect(res.status()).toBe(403);
  });

  test("admin product create validation errors return 400", async ({ request }) => {
    const token = await adminToken(request);
    const res = await request.post(`${BASE_URL}/api/admin/products`, {
      headers: authHeaders(token),
      data: { categoryId: 3, name: "", price: -1 },
    });
    expect(res.status()).toBe(400);
  });
});

