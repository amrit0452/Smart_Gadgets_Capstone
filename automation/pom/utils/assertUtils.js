const { expect } = require("@playwright/test");

async function assertStatusJson(response, expectedSuccess = true) {
  const payload = await response.json();
  expect(payload.success).toBe(expectedSuccess);
  return payload;
}

module.exports = { assertStatusJson };

