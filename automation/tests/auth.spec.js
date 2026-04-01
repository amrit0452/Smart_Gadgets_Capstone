const { test, expect } = require("@playwright/test");
const { uniqueId } = require("./helpers/unique");
const { BASE_URL, registerUser, loginUser, loginSeedUser, authHeaders } = require("./helpers/api");

test.describe("Authentication", () => {
  test("register success", async ({ request }) => {
    const email = `auth.reg.${uniqueId()}@example.com`;
    const res = await registerUser(request, { name: "Auth User", email, password: "User@1234" });
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test("register duplicate email returns 409", async ({ request }) => {
    const email = `auth.dupe.${uniqueId()}@example.com`;
    await registerUser(request, { name: "Auth User", email, password: "User@1234" });
    const res2 = await registerUser(request, { name: "Auth User", email, password: "User@1234" });
    expect(res2.status()).toBe(409);
  });

  test("register invalid email rejected", async ({ request }) => {
    const res = await registerUser(request, { name: "Auth User", email: "bad-email", password: "User@1234" });
    expect(res.status()).toBe(400);
  });

  test("register weak password rejected", async ({ request }) => {
    const email = `auth.weak.${uniqueId()}@example.com`;
    const res = await registerUser(request, { name: "Auth User", email, password: "password" });
    expect(res.status()).toBe(400);
  });

  test("register missing name rejected", async ({ request }) => {
    const email = `auth.noname.${uniqueId()}@example.com`;
    const res = await registerUser(request, { name: "", email, password: "User@1234" });
    expect(res.status()).toBe(400);
  });

  test("login success customer", async ({ request }) => {
    const res = await loginUser(request, { email: "user1@example.com", password: "User@1234" });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.token).toBeTruthy();
  });

  test("login success admin", async ({ request }) => {
    const res = await loginUser(request, { email: "admin@example.com", password: "Admin@1234" });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.role).toBe("admin");
  });

  test("login wrong password fails", async ({ request }) => {
    const res = await loginUser(request, { email: "user1@example.com", password: "Wrong@1234" });
    expect(res.status()).toBe(401);
  });

  test("login unknown email fails", async ({ request }) => {
    const res = await loginUser(request, { email: `missing.${uniqueId()}@example.com`, password: "User@1234" });
    expect(res.status()).toBe(401);
  });

  test("login invalid email format rejected", async ({ request }) => {
    const res = await loginUser(request, { email: "bad-email", password: "User@1234" });
    expect(res.status()).toBe(400);
  });

  test("login missing password rejected", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "user1@example.com" },
    });
    expect(res.status()).toBe(400);
  });

  test("forgot password existing user", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/forgot`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "user1@example.com" },
    });
    expect(res.status()).toBe(200);
  });

  test("forgot password unknown user still success", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/forgot`, {
      headers: { "Content-Type": "application/json" },
      data: { email: `unknown.${uniqueId()}@example.com` },
    });
    expect(res.status()).toBe(200);
  });

  test("protected orders endpoint requires token", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/orders`);
    expect(res.status()).toBe(401);
  });

  test("disabled user cannot login", async ({ request }) => {
    const adminToken = await loginSeedUser(request, { email: "admin@example.com", password: "Admin@1234" });
    const usersRes = await request.get(`${BASE_URL}/api/admin/users`, { headers: authHeaders(adminToken) });
    const usersJson = await usersRes.json();
    const user = (usersJson.users || []).find((u) => u.email === "user2@example.com");
    expect(user).toBeTruthy();

    await request.patch(`${BASE_URL}/api/admin/users/${user.user_id}`, {
      headers: authHeaders(adminToken),
      data: { isActive: 0 },
    });
    const disabledLogin = await loginUser(request, { email: "user2@example.com", password: "User@1234" });
    expect(disabledLogin.status()).toBe(403);

    await request.patch(`${BASE_URL}/api/admin/users/${user.user_id}`, {
      headers: authHeaders(adminToken),
      data: { isActive: 1 },
    });
  });
});

