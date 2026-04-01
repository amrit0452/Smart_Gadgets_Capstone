const { devices } = require("@playwright/test");

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: "./tests",
  fullyParallel: false,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  reporter: [
    ["html", { outputFolder: "automation-report", open: "never" }],
    ["list"],
    ["allure-playwright", { outputFolder: "allure-results", detail: true }],
  ],
  webServer: {
    command: "node ../backend/src/server.js",
    url: "http://localhost:3000/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Users should set DB/JWT secrets via env or .env before running.
    env: {
      DB_HOST: process.env.DB_HOST || "localhost",
      DB_USER: process.env.DB_USER || "root",
      DB_PASSWORD: process.env.DB_PASSWORD || "amrit44",
      DB_NAME: process.env.DB_NAME || "neo_gadgets",
      JWT_SECRET: process.env.JWT_SECRET || "9x@A#kL!2mP$zQ8rT^uV1wXyZ",
      PORT: process.env.PORT || "3000",
      CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
};

module.exports = config;
