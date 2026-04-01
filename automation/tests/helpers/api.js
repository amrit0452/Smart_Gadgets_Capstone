const { uniqueId } = require("./unique");

const BASE_URL = process.env.PW_BASE_URL || "http://127.0.0.1:3000";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function registerUser(request, { name, email, password }) {
  return request.post(`${BASE_URL}/api/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { name, email, password },
  });
}

async function loginUser(request, { email, password }) {
  return request.post(`${BASE_URL}/api/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password },
  });
}

async function createUserAndLogin(request, { prefix = "auto.user", name = "Automation User", password = "User@1234" } = {}) {
  const email = `${prefix}.${uniqueId()}@example.com`;
  await registerUser(request, { name, email, password });
  const loginRes = await loginUser(request, { email, password });
  const json = await loginRes.json();
  if (!json.success) throw new Error(`Login failed for ${email}`);
  return { email, password, token: json.token, user: json.user };
}

async function loginSeedUser(request, { email, password }) {
  const res = await loginUser(request, { email, password });
  const json = await res.json();
  if (!json.success) throw new Error(`Seed login failed for ${email}`);
  return json.token;
}

async function addCartItem(request, token, { productId, quantity }) {
  return request.post(`${BASE_URL}/api/cart/items`, {
    headers: authHeaders(token),
    data: { productId, quantity },
  });
}

async function placeCheckout(request, token, body) {
  return request.post(`${BASE_URL}/api/checkout/place`, {
    headers: authHeaders(token),
    data: body,
  });
}

async function createOrderForUser(request, token, { productId = 104, quantity = 1, paymentMethod = "CREDIT" } = {}) {
  const addRes = await addCartItem(request, token, { productId, quantity });
  const addJson = await addRes.json();
  if (!addJson.success) throw new Error("Failed to seed cart for order");

  const baseAddress = {
    line1: "221B Baker Street",
    city: "London",
    state: "LDN",
    zip: "12345",
    country: "UK",
  };
  let payment;
  if (paymentMethod === "UPI") {
    payment = { paymentMethod: "UPI", upiId: "amrit@upi" };
  } else {
    payment = { paymentMethod: "CREDIT", cardNumber: "4111111111111111", expiry: "12/2099", cvv: "123" };
  }

  const placeRes = await placeCheckout(request, token, { ...baseAddress, ...payment });
  const placeJson = await placeRes.json();
  if (!placeJson.success) throw new Error("Failed to create order");
  return placeJson.orderId;
}

module.exports = {
  BASE_URL,
  authHeaders,
  registerUser,
  loginUser,
  createUserAndLogin,
  loginSeedUser,
  addCartItem,
  placeCheckout,
  createOrderForUser,
};
