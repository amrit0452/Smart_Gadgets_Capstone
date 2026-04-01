const { test: base } = require("@playwright/test");

const BASE_URL = process.env.PW_BASE_URL || "http://localhost:3000";

async function getTokenByAPI(request, email, password) {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json?.error?.message || "Login failed");
  return json.token;
}

exports.test = base.extend({
  customerToken: async ({ request }, use) => {
    const token = await getTokenByAPI(request, "user1@example.com", "User@1234");
    await use(token);
  },

  adminToken: async ({ request }, use) => {
    const token = await getTokenByAPI(request, "admin@example.com", "Admin@1234");
    await use(token);
  },

  autoAuthCustomer: async ({ page, customerToken }, use) => {
    await page.context().addInitScript((t) => window.localStorage.setItem("token", t), customerToken);
    await use({ token: customerToken });
  },
});

