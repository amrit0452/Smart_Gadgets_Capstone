const { getPool } = require("../models/db");
const { addReviewOrUpdate, deleteReview, getReviewByUserProduct } = require("../models/storeModel");

async function upsert(req, res) {
  const productId = Number(req.params.productId);
  const userId = req.user.userId;
  const rating = Number(req.body.rating);
  const reviewText = req.body.reviewText;

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await addReviewOrUpdate(connection, { userId, productId, rating, reviewText });
    await connection.commit();
    return res.status(200).json({ success: true, message: "Review saved" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Review save failed" } });
  } finally {
    connection.release();
  }
}

async function del(req, res) {
  const productId = Number(req.params.productId);
  const userId = req.user.userId;

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const existing = await getReviewByUserProduct(connection, { userId, productId });
    if (!existing) {
      // Check if review exists for other user to return a more accurate ownership error.
      const [rows] = await connection.query("SELECT user_id FROM reviews WHERE product_id = ? LIMIT 1", [
        productId,
      ]);
      if (rows.length) {
        await connection.rollback();
        return res.status(403).json({ success: false, error: { message: "Forbidden" } });
      }
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: "Review not found" } });
    }

    await deleteReview(connection, { userId, productId });
    await connection.commit();
    return res.status(200).json({ success: true, message: "Review deleted" });
  } catch (e) {
    await connection.rollback();
    return res.status(500).json({ success: false, error: { message: "Delete failed" } });
  } finally {
    connection.release();
  }
}

module.exports = { upsert, del };

