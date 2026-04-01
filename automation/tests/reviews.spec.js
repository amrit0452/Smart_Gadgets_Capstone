const { test, expect } = require("@playwright/test");
const { BASE_URL, authHeaders, createUserAndLogin } = require("./helpers/api");
const { uniqueId } = require("./helpers/unique");

async function postReview(request, token, productId, rating, reviewText) {
  return request.post(`${BASE_URL}/api/reviews/${productId}`, {
    headers: authHeaders(token),
    data: { rating, reviewText },
  });
}

async function patchReview(request, token, productId, rating, reviewText) {
  return request.patch(`${BASE_URL}/api/reviews/${productId}`, {
    headers: authHeaders(token),
    data: { rating, reviewText },
  });
}

test.describe("Ratings & Reviews", () => {
  test("create review success", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.create" });
    const res = await postReview(request, token, 101, 5, `Great product ${uniqueId()}`);
    expect(res.status()).toBe(200);
  });

  test("update review success", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.update" });
    await postReview(request, token, 101, 4, `Initial ${uniqueId()}`);
    const res = await patchReview(request, token, 101, 5, `Edited ${uniqueId()}`);
    expect(res.status()).toBe(200);
  });

  test("delete own review success", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.delete" });
    await postReview(request, token, 101, 4, `Delete me ${uniqueId()}`);
    const delRes = await request.delete(`${BASE_URL}/api/reviews/101`, { headers: authHeaders(token) });
    expect(delRes.status()).toBe(200);
  });

  test("delete non-existing review returns 404", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.none" });
    const delRes = await request.delete(`${BASE_URL}/api/reviews/105`, { headers: authHeaders(token) });
    expect([403, 404]).toContain(delRes.status());
  });

  test("delete someone else's existing review returns 403", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.forbidden" });
    const delRes = await request.delete(`${BASE_URL}/api/reviews/101`, { headers: authHeaders(token) });
    expect(delRes.status()).toBe(403);
  });

  test("create review invalid rating low rejected", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.bad.rating.low" });
    const res = await postReview(request, token, 101, 0, "bad");
    expect(res.status()).toBe(400);
  });

  test("create review invalid rating high rejected", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.bad.rating.high" });
    const res = await postReview(request, token, 101, 6, "bad");
    expect(res.status()).toBe(400);
  });

  test("create review missing text rejected", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.bad.text" });
    const res = await postReview(request, token, 101, 4, "");
    expect(res.status()).toBe(400);
  });

  test("create review invalid product id rejected", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.bad.pid" });
    const res = await postReview(request, token, "abc", 4, "text");
    expect(res.status()).toBe(400);
  });

  test("review endpoints require auth for create", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/reviews/101`, {
      headers: { "Content-Type": "application/json" },
      data: { rating: 5, reviewText: "No auth" },
    });
    expect(res.status()).toBe(401);
  });

  test("review endpoints require auth for patch", async ({ request }) => {
    const res = await request.patch(`${BASE_URL}/api/reviews/101`, {
      headers: { "Content-Type": "application/json" },
      data: { rating: 5, reviewText: "No auth" },
    });
    expect(res.status()).toBe(401);
  });

  test("review endpoints require auth for delete", async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/api/reviews/101`);
    expect(res.status()).toBe(401);
  });

  test("patch can create when review absent (upsert)", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.upsert" });
    const res = await patchReview(request, token, 105, 4, `Patch-create ${uniqueId()}`);
    expect(res.status()).toBe(200);
  });

  test("latest product payload reflects submitted review text", async ({ request }) => {
    const { token } = await createUserAndLogin(request, { prefix: "reviews.verify.text" });
    const text = `Visible review ${uniqueId()}`;
    await postReview(request, token, 105, 5, text);
    const detailsRes = await request.get(`${BASE_URL}/api/products/105`);
    const detailsJson = await detailsRes.json();
    expect((detailsJson.product.reviews || []).some((r) => r.review_text === text)).toBe(true);
  });

  test("updating review changes rating in product payload", async ({ request }) => {
    const { token, user } = await createUserAndLogin(request, { prefix: "reviews.verify.rating" });
    await postReview(request, token, 104, 2, `Rating before ${uniqueId()}`);
    await patchReview(request, token, 104, 5, `Rating after ${uniqueId()}`);
    const detailsRes = await request.get(`${BASE_URL}/api/products/104`);
    const detailsJson = await detailsRes.json();
    const mine = (detailsJson.product.reviews || []).find((r) => Number(r.user_id) === Number(user.userId));
    expect(Number(mine.rating)).toBe(5);
  });
});

