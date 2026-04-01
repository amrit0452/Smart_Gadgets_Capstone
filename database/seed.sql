USE neo_gadgets;

-- Users (password hashes generated with bcrypt)
INSERT INTO users (user_id, name, email, password_hash, role, is_active, created_at) VALUES
  (1, 'Admin', 'admin@example.com', '$2b$10$GM2LICNroa3GQyd0Ylxg3upbR2WbCmMm71kPq1yAxi9GpadnHvfoe', 'admin', 1, '2026-03-30 10:00:00'),
  (2, 'User One', 'user1@example.com', '$2b$10$VTVv7K6bGpMaAXfRUK3WJuG2lCK1BK2Y8WxiW9UC7/0XitSuoaET6', 'customer', 1, '2026-03-30 10:05:00'),
  (3, 'User Two', 'user2@example.com', '$2b$10$VTVv7K6bGpMaAXfRUK3WJuG2lCK1BK2Y8WxiW9UC7/0XitSuoaET6', 'customer', 1, '2026-03-30 10:06:00');

-- Categories
INSERT INTO categories (category_id, name, created_at) VALUES
  (1, 'Wearables', '2026-03-30 10:10:00'),
  (2, 'Phones', '2026-03-30 10:11:00'),
  (3, 'Accessories', '2026-03-30 10:12:00');

-- Products
-- Stock values reflect reservations from seeded orders (so cancel/return can restore correctly).
INSERT INTO products
  (product_id, category_id, brand, name, description, price, stock_quantity, is_available, image_urls, created_at, updated_at)
VALUES
(101, 1, 'Nebula', 'Nebula Watch', 'Smart watch with health tracking', 79.99, 9999, 1, '["/images/watch1.svg","/images/watch2.svg"]', '2026-03-30 11:00:00', '2026-03-30 11:00:00'),
(102, 1, 'Nebula', 'Nebula Band', 'Fitness band with notifications', 19.99, 0, 0, '["/images/band1.svg"]', '2026-03-30 11:01:00', '2026-03-30 11:01:00'),
(103, 2, 'Pulse', 'Pulse Phone X', 'Flagship phone with fast performance', 599.00, 9999, 1, '["/images/phonex1.svg","/images/phonex2.svg"]', '2026-03-30 11:02:00', '2026-03-30 11:02:00'),
(104, 2, 'Pulse', 'Pulse Phone Lite', 'Affordable phone with great battery', 299.50, 9999, 1, '["/images/phonelite1.svg"]', '2026-03-30 11:03:00', '2026-03-30 11:03:00'),
(105, 3, 'Orbit', 'Orbit Charger 30W', 'Fast charger 30W for mobile devices', 29.99, 9999, 1, '["/images/charger1.svg"]', '2026-03-30 11:04:00', '2026-03-30 11:04:00'),
(106, 3, 'Orbit', 'Orbit Cable USB-C', 'Durable USB-C cable', 9.99, 9999, 1, '["/images/cable1.svg","/images/cable2.svg"]', '2026-03-30 11:05:00', '2026-03-30 11:05:00');

-- Reviews for aggregation tests
INSERT INTO reviews (review_id, product_id, user_id, rating, review_text, created_at, updated_at) VALUES
  (1, 101, 2, 5, 'Excellent.', '2026-03-30 12:00:00', '2026-03-30 12:00:00'),
  (2, 101, 3, 4, 'Good value.', '2026-03-30 12:10:00', '2026-03-30 12:10:00'),
  (3, 103, 2, 3, 'Okay.', '2026-03-30 12:20:00', '2026-03-30 12:20:00');

-- Seed orders + order_items + payments (so Orders module can be tested)
-- Reservation effect:
-- Order 201 reserves 1 unit of product 101 -> product stock is seeded as 9 (10-1).
-- Order 202 reserves 1 unit of product 103 -> product stock is seeded as 4 (5-1).

INSERT INTO orders
  (order_id, user_id, ship_address_line1, ship_city, ship_state, ship_zip, ship_country,
   subtotal, total, order_status, payment_method, payment_status, created_at, cancelled_at, returned_at)
VALUES
  (201, 2, '221B Baker Street', 'London', 'LDN', '12345', 'UK', 79.99, 79.99, 'CREATED', 'CREDIT', 'SUCCESS',
   '2026-03-30 13:00:00', NULL, NULL),
  (202, 2, '742 Evergreen Terrace', 'Springfield', 'SPF', '54321', 'US', 599.00, 599.00, 'DELIVERED', 'UPI', 'SUCCESS',
   '2026-03-30 13:05:00', NULL, NULL);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price) VALUES
  (301, 201, 101, 1, 79.99),
  (302, 202, 103, 1, 599.00);

INSERT INTO payments (payment_id, order_id, payment_method, payment_status, meta_json, created_at, paid_at, refunded_at) VALUES
  (401, 201, 'CREDIT', 'SUCCESS', '{\"last4\":\"1111\"}', '2026-03-30 13:00:01', '2026-03-30 13:00:01', NULL),
  (402, 202, 'UPI', 'SUCCESS', '{\"upiId\":\"amrit@upi\"}', '2026-03-30 13:05:01', '2026-03-30 13:05:01', NULL);

-- Re-enable auto_increment behavior (optional but keeps inserts clean)
ALTER TABLE users AUTO_INCREMENT = 4;
ALTER TABLE categories AUTO_INCREMENT = 4;
ALTER TABLE products AUTO_INCREMENT = 107;
ALTER TABLE reviews AUTO_INCREMENT = 4;
ALTER TABLE orders AUTO_INCREMENT = 203;
ALTER TABLE order_items AUTO_INCREMENT = 303;
ALTER TABLE payments AUTO_INCREMENT = 403;

