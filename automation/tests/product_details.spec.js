const { test, expect } = require("@playwright/test");
const { BASE_URL } = require("./helpers/api");

async function getProduct(request, id) {
  return request.get(`${BASE_URL}/api/products/${id}`);
}

test.describe("Product Details Page", () => {
  test("product 101 returns success", async ({ request }) => {
    const res = await getProduct(request, 101);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test("product includes expected name", async ({ request }) => {
    const res = await getProduct(request, 101);
    const json = await res.json();
    expect(json.product.name).toMatch(/Nebula Watch/i);
  });

  test("product includes description text", async ({ request }) => {
    const res = await getProduct(request, 101);
    const json = await res.json();
    expect(json.product.description).toMatch(/health tracking/i);
  });

  test("product includes reviews array", async ({ request }) => {
    const res = await getProduct(request, 101);
    const json = await res.json();
    expect(Array.isArray(json.product.reviews)).toBe(true);
  });

  test("product includes image urls", async ({ request }) => {
    const res = await getProduct(request, 101);
    const json = await res.json();
    const images = Array.isArray(json.product.image_urls)
      ? json.product.image_urls
      : JSON.parse(json.product.image_urls || "[]");
    expect(images.length).toBeGreaterThan(0);
  });

  test("out-of-stock product has stock 0", async ({ request }) => {
    const res = await getProduct(request, 102);
    const json = await res.json();
    expect(Number(json.product.stock_quantity)).toBe(0);
  });

  test("out-of-stock product marked unavailable", async ({ request }) => {
    const res = await getProduct(request, 102);
    const json = await res.json();
    expect(Number(json.product.is_available)).toBe(0);
  });

  test("product 106 stock matches seed", async ({ request }) => {
    const res = await getProduct(request, 106);
    const json = await res.json();
    expect(Number(json.product.stock_quantity)).toBe(9999);
  });

  test("product rating fields exist", async ({ request }) => {
    const res = await getProduct(request, 101);
    const json = await res.json();
    expect(json.product.rating_avg).toBeDefined();
    expect(json.product.rating_count).toBeDefined();
  });

  test("product has category and brand", async ({ request }) => {
    const res = await getProduct(request, 101);
    const json = await res.json();
    expect(json.product.category_name).toBeTruthy();
    expect(json.product.brand).toBeTruthy();
  });

  test("unknown product returns 404", async ({ request }) => {
    const res = await getProduct(request, 999999);
    expect(res.status()).toBe(404);
  });

  test("invalid product id returns 400", async ({ request }) => {
    const res = await getProduct(request, "abc");
    expect(res.status()).toBe(400);
  });

  test("zero product id returns 400", async ({ request }) => {
    const res = await getProduct(request, 0);
    expect(res.status()).toBe(400);
  });

  test("product details page loads in browser", async ({ page }) => {
    // Do not require r.status()===200 in the predicate — if the API returns 4xx/5xx, the
    // predicate would never pass and this would hang until the test timeout.
    const productRes = page.waitForResponse((r) => {
      try {
        const u = new URL(r.url());
        return r.request().method() === "GET" && u.pathname === "/api/products/101";
      } catch {
        return false;
      }
    });
    await page.goto("/Product.html?id=101");
    const res = await productRes;
    expect(res.status()).toBe(200);
    await expect(page.locator("#productTitle")).toContainText(/Nebula/i);
  });

  test("qty boundary UI check remains on same page", async ({ page }) => {
    const productRes = page.waitForResponse((r) => {
      try {
        const u = new URL(r.url());
        return r.request().method() === "GET" && u.pathname === "/api/products/106";
      } catch {
        return false;
      }
    });
    await page.goto("/Product.html?id=106");
    const res = await productRes;
    expect(res.status()).toBe(200);
    await page.locator("#qty").fill("10000");
    await page.locator("#addToCartBtn").click();
    await expect(page.locator("#qtyErr")).toContainText(/Quantity exceeds stock/i);
  });
});

