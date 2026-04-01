## Neo Gadgets QE Test Scenarios (8 Modules)

### Module 1: User Authentication (16 scenarios)
1. Successful registration with valid fields.
2. Registration rejects duplicate email.
3. Registration rejects invalid email format.
4. Registration rejects weak password (boundary: minimum length).
5. Registration rejects missing required fields (client + API).
6. Successful login with correct credentials.
7. Login rejects wrong password (negative).
8. Login rejects missing password field (validation).
9. JWT stored in `localStorage` after login.
10. Protected route denies request without JWT (auth error handling).
11. Forgot password accepts registered email and returns success message.
12. Forgot password rejects unregistered email (or returns generic message; verify contract).
13. Token/session expiration simulated; protected route returns unauthorized.
14. Logout (if implemented) clears localStorage token.
15. Error message shape is consistent for validation errors (API & UI).
16. Backend returns 4xx for invalid payload; no DB row created.

### Module 2: Product Catalog (16 scenarios)
1. Category listing loads with default category or all categories.
2. Catalog search finds products by partial name.
3. Search is case-insensitive.
4. Filters: price range lower/upper boundary (min/max).
5. Filters: brand filter returns only selected brand.
6. Filters: ratings filter returns products with avg rating >= threshold.
7. Filters: availability filter returns only in-stock items.
8. Sorting low→high price order is correct.
9. Sorting high→low price order is correct.
10. Sorting by latest updates (created_at/updated_at mapping).
11. Sorting by popularity (order count or review count) is correct.
12. Combined filters + search yield consistent reduced set.
13. Invalid filter parameters (e.g., negative price) return validation error.
14. No results returns empty state (no server error).
15. Catalog API response matches UI rendering (counts and product fields).
16. Performance sanity: pagination (if implemented) returns deterministic page sizes.

### Module 3: Product Details Page (16 scenarios)
1. Product description renders correctly.
2. Multiple images render and cycle/preview.
3. Reviews & ratings summary displays average rating and count.
4. Review list loads with correct ordering (latest first or relevant policy).
5. Add to cart from product page succeeds when in stock.
6. Add to cart from product page rejects product with quantity > available stock.
7. Stock validation on add-to-cart happens on backend (not only UI).
8. Add to cart updates cart badge/count in UI (if implemented).
9. Product detail shows correct current price (price changes reflected from catalog).
10. Product detail fetch fails gracefully (error UI).
11. Reviews submission by authenticated user is allowed.
12. Reviews submission by unauthenticated user is blocked.
13. Duplicate review by same user for same product respects constraint (update vs reject).
14. Review editing reflects immediately in rating aggregation.
15. Delete review updates aggregation and review list.
16. DB join correctness: product fields + category + stock fields match UI.

### Module 4: Shopping Cart (16 scenarios)
1. Add item to cart from catalog.
2. Add same item increments quantity (within stock).
3. Add item when cart already contains other items keeps totals correct.
4. Remove item deletes cart_item row and updates totals.
5. Update quantity within stock works.
6. Update quantity to 0 removes item (if policy) or rejects.
7. Update quantity above stock is rejected with error.
8. Price updates after product price change are reflected (policy: snapshot vs live; verify contract).
9. Cart totals: sum(cart_items * unit_price) matches backend computed total.
10. Cart totals: handle rounding to currency (boundary test for decimals).
11. Cart persists across refresh (localStorage/cart id).
12. Unauthenticated cart operations handled (redirect or 401).
13. Backend prevents inconsistent cart state (FK constraints).
14. Stock changes between add and checkout do not allow oversell at checkout.
15. Cart fetch returns consistent quantity and availability info.
16. Cart API errors are displayed in UI.

### Module 5: Checkout + Address + Payment Simulation (16 scenarios)
1. Address form validates required fields.
2. Address boundary values (max length, whitespace trimming).
3. Order review page shows cart items, totals, and shipping/billing summary.
4. Checkout requires login.
5. Credit card: valid number passes Luhn and expiry not in past.
6. Credit card: invalid number fails Luhn.
7. Credit card: expired card rejected (boundary: current month/year).
8. Credit card: insufficient funds rejected with payment failure.
9. Debit card: valid debit card passes rules (same Luhn/expiry rules).
10. Debit card: invalid debit card fails.
11. UPI: valid handle for provider `@ybl`.
12. UPI: valid handle for provider `@upi`.
13. UPI: valid handle for provider `@oksbi` and `@okhdfc`.
14. UPI: invalid provider/format rejected.
15. Payment failure prevents order creation; no stock decrement.
16. Successful payment creates order, order_items, and payments records; stock decremented exactly.

### Module 6: Orders Module (16 scenarios)
1. Order history loads for authenticated user.
2. Order history empty state for new user.
3. Order details page loads correct line items and payment status.
4. Cancel order (allowed only if not already shipped/cancelled; verify policy).
5. Cancel order restores stock quantities.
6. Return order (allowed only if delivered; verify policy or simulate).
7. Return order triggers refund simulation and updates payment record.
8. Refund simulation updates order status and payment status.
9. Invalid order id returns 404.
10. Access control prevents viewing other users’ orders (403/401).
11. Cancel/return on out-of-state orders is rejected.
12. Pagination (if implemented) returns deterministic results.
13. UI reflects status changes without manual refresh (if implemented) or after refresh.
14. Orders table join correctness: order_items aggregation equals order subtotal.
15. Payments and orders consistency: one payment per order (or policy).
16. Edge: cart becomes stale after checkout; verify order uses checkout snapshot.

### Module 7: Ratings & Reviews (16 scenarios)
1. Submit new review with rating boundary: minimum allowed.
2. Submit review with rating maximum allowed.
3. Submit review with empty/invalid text rejected.
4. Submit review unauthenticated is blocked.
5. Submit review updates reviews list and average rating.
6. Edit review retains product relationship and updates rating aggregation.
7. Edit review with invalid rating rejected.
8. Delete review removes from list and updates aggregation.
9. Delete review unauthenticated blocked.
10. Delete/edits only allowed for review owner (access control).
11. Prevent duplicate review on same product if policy is one review per user/product.
12. Rating calculation rounds correctly (boundary: 4.49 vs 4.50 style).
13. Reviews sorting (latest first) is consistent.
14. Reviews aggregation queries match UI values (avg + count).
15. Backend rejects invalid product id review creation (404/validation).
16. UI error handling on review API failure.

### Module 8: Admin Dashboard (16 scenarios)
1. Admin login required.
2. Admin can create new product with category/brand mapping.
3. Admin rejects product creation with missing required fields.
4. Admin rejects product creation with non-numeric price/negative price.
5. Admin can update product stock and price.
6. Admin can delete product; product disappears from catalog.
7. Admin can manage categories (create/update; if implemented in scope).
8. Admin can view order list and order details.
9. Admin can cancel eligible orders from admin actions.
10. Admin can return eligible orders and trigger refund simulation.
11. Admin can manage users (disable/enable; if implemented) or view details.
12. Admin denies non-admin users from admin endpoints.
13. Revenue report shows correct totals from payments table.
14. Revenue report matches orders by status/payment success.
15. Admin CRUD changes reflect in frontend catalog/product details.
16. DB constraints: FK references prevent orphan cart_items/order_items/reviews.

