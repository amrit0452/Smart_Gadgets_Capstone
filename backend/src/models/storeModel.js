const { getPool } = require("./db");

function buildProductQuery(filters = {}, sort = "latest") {
  const where = [];
  const params = [];

  // Search
  if (filters.search) {
    where.push("(p.name LIKE ? OR p.description LIKE ?)");
    const s = `%${filters.search}%`;
    params.push(s, s);
  }

  if (filters.categoryId) {
    where.push("p.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.brand) {
    where.push("p.brand = ?");
    params.push(filters.brand);
  }

  if (typeof filters.minPrice === "number") {
    where.push("p.price >= ?");
    params.push(filters.minPrice);
  }

  if (typeof filters.maxPrice === "number") {
    where.push("p.price <= ?");
    params.push(filters.maxPrice);
  }

  if (typeof filters.minRating === "number") {
    where.push("(SELECT COALESCE(AVG(r.rating),0) FROM reviews r WHERE r.product_id = p.product_id) >= ?");
    params.push(filters.minRating);
  }

  // Availability filter (in-stock only)
  if (filters.availability === "in_stock") {
    where.push("p.is_available = 1 AND p.stock_quantity > 0");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Sorting
  let orderBy = "p.created_at DESC";
  if (sort === "price_asc") orderBy = "p.price ASC";
  if (sort === "price_desc") orderBy = "p.price DESC";
  if (sort === "latest") orderBy = "p.created_at DESC";
  if (sort === "popularity") {
    // Deterministic “popularity” proxy: review count
    orderBy =
      "(SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.product_id) DESC, p.created_at DESC";
  }

  return { whereSql, params, orderBy };
}

async function getCategories() {
  const pool = getPool();
  const [rows] = await pool.query("SELECT category_id, name FROM categories ORDER BY name ASC");
  return rows;
}

async function listProducts(filters = {}) {
  const pool = getPool();

  const sort = filters.sort || "latest";
  const { whereSql, params, orderBy } = buildProductQuery(filters, sort);

  const sql = `
    SELECT
      p.product_id,
      p.name,
      p.brand,
      p.description,
      p.price,
      p.stock_quantity,
      p.is_available,
      p.image_urls,
      p.created_at,
      p.updated_at,
      c.category_id,
      c.name AS category_name,
      COALESCE((
        SELECT AVG(r.rating)
        FROM reviews r
        WHERE r.product_id = p.product_id
      ), 0) AS rating_avg,
      (
        SELECT COUNT(*)
        FROM reviews r
        WHERE r.product_id = p.product_id
      ) AS rating_count
    FROM products p
    INNER JOIN categories c ON c.category_id = p.category_id
    ${whereSql}
    ORDER BY ${orderBy}
  `;

  const [rows] = await pool.query(sql, params);
  return rows.map((r) => {
    let imgs = [];
    try {
      if (Array.isArray(r.image_urls)) imgs = r.image_urls;
      else imgs = JSON.parse(r.image_urls || "[]");
    } catch {
      imgs = [];
    }
    return { ...r, image_urls: imgs };
  });
}

async function getProductStockById(productId) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT product_id, price, stock_quantity, is_available FROM products WHERE product_id = ? LIMIT 1",
    [productId]
  );
  return rows[0] || null;
}

async function getCartItem(connection, cartId, productId) {
  const [rows] = await connection.query(
    "SELECT quantity, unit_price FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1",
    [cartId, productId]
  );
  return rows[0] || null;
}

async function getProductById(productId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
      SELECT
        p.product_id, p.name, p.brand, p.description, p.price, p.stock_quantity, p.is_available, p.image_urls,
        p.created_at, p.updated_at,
        c.category_id, c.name AS category_name,
        COALESCE((
          SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.product_id
        ), 0) AS rating_avg,
        (
          SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.product_id
        ) AS rating_count
      FROM products p
      INNER JOIN categories c ON c.category_id = p.category_id
      WHERE p.product_id = ?
      LIMIT 1
    `,
    [productId]
  );

  if (!rows.length) return null;
  const product = rows[0];

  try {
    if (!Array.isArray(product.image_urls)) {
      product.image_urls = JSON.parse(product.image_urls || "[]");
    }
  } catch {
    product.image_urls = [];
  }

  // MySQL JSON string to JS array (mysql2 returns Buffer/string; normalize at controller/front-end level).
  // Here we just pass through `image_urls`.

  const [reviews] = await pool.query(
    `
      SELECT r.review_id, r.user_id, u.name AS user_name, r.rating, r.review_text, r.created_at, r.updated_at
      FROM reviews r
      INNER JOIN users u ON u.user_id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `,
    [productId]
  );

  product.reviews = reviews;
  return product;
}

async function getUserByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  return rows[0] || null;
}

async function getUserById(userId) {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM users WHERE user_id = ? LIMIT 1", [userId]);
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, role }) {
  const pool = getPool();
  const [res] = await pool.query(
    "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)",
    [name, email, passwordHash, role]
  );
  return res.insertId;
}

async function listUsersAdmin() {
  const pool = getPool();
  const [rows] = await pool.query("SELECT user_id, name, email, role, is_active, created_at FROM users ORDER BY user_id DESC");
  return rows;
}

async function setUserActive(connection, userId, isActive) {
  await connection.query("UPDATE users SET is_active = ? WHERE user_id = ?", [isActive ? 1 : 0, userId]);
}

function upsertCartItemSql() {
  return `
    INSERT INTO cart_items (cart_id, product_id, quantity, unit_price, added_at)
    VALUES (?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      quantity = VALUES(quantity),
      unit_price = VALUES(unit_price),
      added_at = NOW()
  `;
}

async function getOrCreateCart(connection, userId) {
  const [rows] = await connection.query("SELECT cart_id FROM cart WHERE user_id = ? LIMIT 1", [userId]);
  if (rows.length) return rows[0].cart_id;

  const [res] = await connection.query("INSERT INTO cart (user_id) VALUES (?)", [userId]);
  return res.insertId;
}

async function upsertCartItem(connection, { cartId, productId, quantity, unitPrice }) {
  await connection.query(upsertCartItemSql(), [cartId, productId, quantity, unitPrice]);
}

async function removeCartItem(connection, { cartId, productId }) {
  await connection.query("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", [cartId, productId]);
}

async function getCartSummary(userId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
      SELECT
        c.cart_id,
        ci.product_id,
        p.name AS product_name,
        p.brand,
        ci.quantity,
        ci.unit_price,
        (ci.quantity * ci.unit_price) AS line_total,
        p.stock_quantity,
        p.is_available
      FROM cart c
      INNER JOIN cart_items ci ON ci.cart_id = c.cart_id
      INNER JOIN products p ON p.product_id = ci.product_id
      WHERE c.user_id = ?
    `,
    [userId]
  );

  const items = rows.map((r) => ({
    productId: r.product_id,
    name: r.product_name,
    brand: r.brand,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    lineTotal: r.line_total,
    stockQuantity: r.stock_quantity,
    isAvailable: r.is_available,
  }));

  const subtotal = items.reduce((sum, it) => sum + Number(it.lineTotal), 0);

  return { items, subtotal, cartId: items.length ? rows[0].cart_id : null };
}

async function clearCartItems(connection, userId) {
  await connection.query(
    `
      DELETE ci
      FROM cart_items ci
      INNER JOIN cart c ON c.cart_id = ci.cart_id
      WHERE c.user_id = ?
    `,
    [userId]
  );
}

async function createProduct(connection, product) {
  const [res] = await connection.query(
    `
      INSERT INTO products
        (category_id, name, brand, description, price, stock_quantity, is_available, image_urls)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      product.categoryId,
      product.name,
      product.brand,
      product.description || "",
      product.price,
      product.stockQuantity,
      product.isAvailable ? 1 : 0,
      JSON.stringify(product.imageUrls || []),
    ]
  );
  return res.insertId;
}

async function updateProduct(connection, productId, updates) {
  await connection.query(
    `
      UPDATE products
      SET category_id = ?, name = ?, brand = ?, description = ?, price = ?, stock_quantity = ?, is_available = ?, image_urls = ?
      WHERE product_id = ?
    `,
    [
      updates.categoryId,
      updates.name,
      updates.brand,
      updates.description || "",
      updates.price,
      updates.stockQuantity,
      updates.isAvailable ? 1 : 0,
      JSON.stringify(updates.imageUrls || []),
      productId,
    ]
  );
}

async function deleteProduct(connection, productId) {
  await connection.query("DELETE FROM products WHERE product_id = ?", [productId]);
}

async function addReviewOrUpdate(connection, { userId, productId, rating, reviewText }) {
  await connection.query(
    `
      INSERT INTO reviews (user_id, product_id, rating, review_text, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        review_text = VALUES(review_text),
        updated_at = NOW()
    `,
    [userId, productId, rating, reviewText]
  );
}

async function deleteReview(connection, { userId, productId }) {
  await connection.query("DELETE FROM reviews WHERE user_id = ? AND product_id = ?", [userId, productId]);
}

async function getReviewByUserProduct(connection, { userId, productId }) {
  const [rows] = await connection.query(
    "SELECT * FROM reviews WHERE user_id = ? AND product_id = ? LIMIT 1",
    [userId, productId]
  );
  return rows[0] || null;
}

async function createOrder(connection, { userId, address, subtotal, total, paymentMethod, paymentStatus }) {
  const [res] = await connection.query(
    `
      INSERT INTO orders
        (user_id, ship_address_line1, ship_city, ship_state, ship_zip, ship_country,
         subtotal, total, order_status, payment_method, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', ?, ?)
    `,
    [
      userId,
      address.line1,
      address.city,
      address.state,
      address.zip,
      address.country,
      subtotal,
      total,
      paymentMethod || null,
      paymentStatus || "FAILED",
    ]
  );
  return res.insertId;
}

async function createOrderItems(connection, orderId, items) {
  for (const it of items) {
    await connection.query(
      `
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
      `,
      [orderId, it.productId, it.quantity, it.unitPrice]
    );
  }
}

async function createPayment(connection, { orderId, method, status, meta }) {
  await connection.query(
    `
      INSERT INTO payments (order_id, payment_method, payment_status, meta_json)
      VALUES (?, ?, ?, ?)
    `,
    [orderId, method, status, JSON.stringify(meta || {})]
  );
}

async function listOrdersByUser(userId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
      SELECT o.order_id, o.order_status, o.payment_status, o.total, o.created_at,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `,
    [userId]
  );
  return rows;
}

async function getOrderByIdForUser(userId, orderId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
      SELECT o.*
      FROM orders o
      WHERE o.user_id = ? AND o.order_id = ?
      LIMIT 1
    `,
    [userId, orderId]
  );
  if (!rows.length) return null;

  const order = rows[0];
  const [items] = await pool.query(
    `
      SELECT oi.product_id, p.name AS product_name, oi.quantity, oi.unit_price,
             (oi.quantity * oi.unit_price) AS line_total
      FROM order_items oi
      INNER JOIN products p ON p.product_id = oi.product_id
      WHERE oi.order_id = ?
    `,
    [orderId]
  );

  order.items = items;

  const [payments] = await pool.query("SELECT * FROM payments WHERE order_id = ? LIMIT 1", [orderId]);
  order.payment = payments[0] || null;
  return order;
}

async function listOrdersAdmin() {
  const pool = getPool();
  const [rows] = await pool.query(
    `
      SELECT o.order_id, u.email AS user_email, o.order_status, o.payment_status, o.total, o.created_at
      FROM orders o
      INNER JOIN users u ON u.user_id = o.user_id
      ORDER BY o.created_at DESC
    `
  );
  return rows;
}

async function getOrderForAdmin(orderId) {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM orders WHERE order_id = ? LIMIT 1", [orderId]);
  if (!rows.length) return null;
  const order = rows[0];

  const [items] = await pool.query(
    `
      SELECT oi.product_id, p.name AS product_name, oi.quantity, oi.unit_price
      FROM order_items oi
      INNER JOIN products p ON p.product_id = oi.product_id
      WHERE oi.order_id = ?
    `,
    [orderId]
  );
  order.items = items;

  const [payments] = await pool.query("SELECT * FROM payments WHERE order_id = ? LIMIT 1", [orderId]);
  order.payment = payments[0] || null;
  return order;
}

async function updateOrderStatusAndPayment(connection, { orderId, newOrderStatus, newPaymentStatus }) {
  await connection.query(
    "UPDATE orders SET order_status = ?, payment_status = ? WHERE order_id = ?",
    [newOrderStatus, newPaymentStatus, orderId]
  );
  await connection.query("UPDATE payments SET payment_status = ? WHERE order_id = ?", [
    newPaymentStatus,
    orderId,
  ]);
}

async function restoreStockForOrder(connection, orderId) {
  // Restore stock based on order items.
  const [items] = await connection.query(
    "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
    [orderId]
  );
  for (const it of items) {
    await connection.query("UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?", [
      it.quantity,
      it.product_id,
    ]);
  }
}

async function revenueReport({ fromDate, toDate } = {}) {
  const pool = getPool();
  const where = ["p.payment_status = 'SUCCESS'"];
  const params = [];

  if (fromDate) {
    where.push("p.created_at >= ?");
    params.push(fromDate);
  }
  if (toDate) {
    where.push("p.created_at <= ?");
    params.push(toDate);
  }

  // Totals by day
  const [rows] = await pool.query(
    `
      SELECT DATE(p.created_at) AS day, SUM(o.total) AS revenue
      FROM payments p
      INNER JOIN orders o ON o.order_id = p.order_id
      WHERE ${where.join(" AND ")}
      GROUP BY DATE(p.created_at)
      ORDER BY day DESC
    `,
    params
  );
  return rows;
}

module.exports = {
  // Catalog
  getCategories,
  listProducts,
  getProductById,
  getProductStockById,

  // Auth
  getUserByEmail,
  getUserById,
  createUser,
  listUsersAdmin,
  setUserActive,

  // Cart
  getOrCreateCart,
  getCartItem,
  upsertCartItem,
  removeCartItem,
  getCartSummary,
  clearCartItems,

  // Products (Admin)
  createProduct,
  updateProduct,
  deleteProduct,

  // Reviews
  addReviewOrUpdate,
  deleteReview,
  getReviewByUserProduct,

  // Orders & Payments
  createOrder,
  createOrderItems,
  createPayment,
  listOrdersByUser,
  getOrderByIdForUser,
  listOrdersAdmin,
  getOrderForAdmin,
  updateOrderStatusAndPayment,
  restoreStockForOrder,

  // Revenue
  revenueReport,
};

