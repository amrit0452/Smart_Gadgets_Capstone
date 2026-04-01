async function getStock(connection, productId) {
  const [rows] = await connection.query("SELECT stock_quantity, is_available FROM products WHERE product_id = ?", [
    productId,
  ]);
  if (!rows.length) return null;
  return { stockQuantity: rows[0].stock_quantity, isAvailable: rows[0].is_available };
}

async function decrementStock(connection, productId, qty) {
  // Atomic decrement with guard to prevent oversell.
  const [result] = await connection.query(
    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND stock_quantity >= ?",
    [qty, productId, qty]
  );
  // mysql2 returns result.affectedRows for this query.
  return result.affectedRows > 0;
}

async function restoreStock(connection, productId, qty) {
  await connection.query("UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?", [
    qty,
    productId,
  ]);
}

module.exports = { getStock, decrementStock, restoreStock };

