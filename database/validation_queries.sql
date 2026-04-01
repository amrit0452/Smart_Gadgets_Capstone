USE neo_gadgets;

-- =========================
-- CRUD Validations (samples)
-- =========================

-- Create user (CRUD - create)
-- INSERT INTO users (name, email, password_hash, role, is_active) VALUES ('Demo', 'demo@example.com', '$2b$10$...', 'customer', 1);

-- Read user (CRUD - read)
SELECT user_id, email, role, is_active FROM users WHERE email = 'user1@example.com';

-- Update product stock (CRUD - update)
-- UPDATE products SET stock_quantity = stock_quantity + 1 WHERE product_id = 101;

-- Delete review (CRUD - delete)
-- DELETE FROM reviews WHERE user_id = 2 AND product_id = 101;

-- =========================
-- Join Queries
-- =========================

-- Join Orders + Payments for consistency
SELECT
  o.order_id,
  u.email,
  o.order_status,
  o.payment_status,
  p.payment_method,
  p.payment_status AS payment_row_status,
  o.total
FROM orders o
INNER JOIN users u ON u.user_id = o.user_id
LEFT JOIN payments p ON p.order_id = o.order_id
ORDER BY o.created_at DESC;

-- Join Cart Items with Products for totals (cart total validation)
SELECT
  ci.cart_id,
  ci.product_id,
  p.name,
  ci.quantity,
  ci.unit_price,
  (ci.quantity * ci.unit_price) AS line_total
FROM cart_items ci
INNER JOIN cart c ON c.cart_id = ci.cart_id
INNER JOIN products p ON p.product_id = ci.product_id
WHERE c.user_id = 2;

-- =========================
-- Stock Validation Queries
-- =========================

-- Read current stock (for a lock in a transaction)
SELECT stock_quantity, is_available FROM products WHERE product_id = 101 FOR UPDATE;

-- Guarded decrement (prevents oversell)
-- Returns 1 affected row only if stock_quantity >= qty
-- UPDATE products
--   SET stock_quantity = stock_quantity - 2
-- WHERE product_id = 101 AND stock_quantity >= 2;

-- =========================
-- Orders + Payments Consistency
-- =========================

-- Ensure each order has at most one payment row (payments.order_id is UNIQUE)
SELECT
  o.order_id,
  COUNT(p.payment_id) AS payment_rows
FROM orders o
LEFT JOIN payments p ON p.order_id = o.order_id
GROUP BY o.order_id
HAVING COUNT(p.payment_id) > 1;

-- Ensure payment success matches order payment_status (UI should display consistent)
SELECT
  o.order_id,
  o.payment_status AS orders_payment_status,
  p.payment_status AS payments_payment_status
FROM orders o
LEFT JOIN payments p ON p.order_id = o.order_id
WHERE p.payment_id IS NOT NULL
  AND o.payment_status <> p.payment_status;

-- =========================
-- Reviews Aggregation Queries
-- =========================

-- Rating aggregation (avg + count) per product
SELECT
  p.product_id,
  p.name,
  COALESCE(AVG(r.rating), 0) AS rating_avg,
  COUNT(r.review_id) AS rating_count
FROM products p
LEFT JOIN reviews r ON r.product_id = p.product_id
GROUP BY p.product_id, p.name
ORDER BY rating_count DESC;

-- =========================
-- UI vs DB Data Matching Checks
-- =========================

-- Product details API fields sanity check (example for product_id=101)
SELECT
  p.product_id, p.name, p.brand, p.price, p.stock_quantity, p.is_available,
  (SELECT COALESCE(AVG(r.rating),0) FROM reviews r WHERE r.product_id = p.product_id) AS rating_avg,
  (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.product_id) AS rating_count
FROM products p
WHERE p.product_id = 101;

