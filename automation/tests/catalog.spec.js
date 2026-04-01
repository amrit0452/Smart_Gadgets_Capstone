const { test, expect } = require("@playwright/test");
const { BASE_URL } = require("./helpers/api");

async function getProducts(request, query = "") {
  const res = await request.get(`${BASE_URL}/api/catalog/products${query ? `?${query}` : ""}`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.success).toBe(true);
  return json.products || [];
}

test.describe("Product Catalog", () => {
  test("categories endpoint returns list", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/catalog/categories`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.categories)).toBe(true);
    expect(json.categories.length).toBeGreaterThan(0);
  });

  test("products default query returns rows", async ({ request }) => {
    const products = await getProducts(request);
    expect(products.length).toBeGreaterThan(0);
  });

  test("search watch returns relevant results", async ({ request }) => {
    const products = await getProducts(request, "search=watch");
    expect(products.some((p) => /watch/i.test(p.name))).toBe(true);
  });

  test("search gibberish returns no products", async ({ request }) => {
    const products = await getProducts(request, "search=zzzz-no-hit-123");
    expect(products.length).toBe(0);
  });

  test("category filter returns only category 1", async ({ request }) => {
    const products = await getProducts(request, "category_id=1");
    expect(products.every((p) => Number(p.category_id) === 1)).toBe(true);
  });

  test("brand filter returns only Nebula", async ({ request }) => {
    const products = await getProducts(request, "brand=Nebula");
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((p) => p.brand === "Nebula")).toBe(true);
  });

  test("minPrice filter enforces lower bound", async ({ request }) => {
    const products = await getProducts(request, "minPrice=100");
    expect(products.every((p) => Number(p.price) >= 100)).toBe(true);
  });

  test("maxPrice filter enforces upper bound", async ({ request }) => {
    const products = await getProducts(request, "maxPrice=30");
    expect(products.every((p) => Number(p.price) <= 30)).toBe(true);
  });

  test("price range filter works", async ({ request }) => {
    const products = await getProducts(request, "minPrice=20&maxPrice=100");
    expect(products.every((p) => Number(p.price) >= 20 && Number(p.price) <= 100)).toBe(true);
  });

  test("minRating filter works", async ({ request }) => {
    const products = await getProducts(request, "minRating=4");
    expect(products.every((p) => Number(p.rating_avg || 0) >= 4)).toBe(true);
  });

  test("availability in_stock excludes unavailable products", async ({ request }) => {
    const products = await getProducts(request, "availability=in_stock");
    expect(products.every((p) => Number(p.is_available) === 1 && Number(p.stock_quantity) > 0)).toBe(true);
  });

  test("sort price asc is non-decreasing", async ({ request }) => {
    const products = await getProducts(request, "sort=price_asc");
    for (let i = 1; i < products.length; i++) {
      expect(Number(products[i].price)).toBeGreaterThanOrEqual(Number(products[i - 1].price));
    }
  });

  test("sort price desc is non-increasing", async ({ request }) => {
    const products = await getProducts(request, "sort=price_desc");
    for (let i = 1; i < products.length; i++) {
      expect(Number(products[i].price)).toBeLessThanOrEqual(Number(products[i - 1].price));
    }
  });

  test("sort latest returns data", async ({ request }) => {
    const products = await getProducts(request, "sort=latest");
    expect(products.length).toBeGreaterThan(0);
  });

  test("combined filters still return valid shape", async ({ request }) => {
    const products = await getProducts(request, "search=orbit&availability=in_stock&sort=price_asc");
    expect(Array.isArray(products)).toBe(true);
    expect(products.every((p) => p.product_id && p.name && p.price !== undefined)).toBe(true);
  });
});

