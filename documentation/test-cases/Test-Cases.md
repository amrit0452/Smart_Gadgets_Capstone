# Neo Gadgets QE Detailed Test Cases (128+)

> Notes:
> - “UI” expectations mean the page shows the correct message/DOM state.
> - “API/DB” expectations mean status codes and DB records must match.
> - Test data placeholders are resolved via `documentation/test-data/Test-Data-Sheet.md`.

---

## Module 1: User Authentication

### TC-AUTH-001 — Register success
- Module: User Authentication
- Description: Register with valid name/email/password creates a new user.
- Preconditions: User email does not exist.
- Steps:
  1. Open `Register.html`.
  2. Enter valid fields.
  3. Submit registration.
- Test Data:
  - name: `Test User`
  - email: `user1@example.com` (unique)
  - password: `User@1234`
- Expected Result:
  - UI shows success.
  - Backend returns `201 Created`.
  - New row exists in `users`.

### TC-AUTH-002 — Register rejects duplicate email
- Preconditions: `user1@example.com` already exists.
- Steps:
  1. Attempt to register using `user1@example.com`.
- Test Data:
  - email: `user1@example.com`
  - password: `Another@1234`
- Expected Result:
  - UI/API shows “email already in use”.
  - No duplicate user row created.

### TC-AUTH-003 — Register invalid email format
- Preconditions: Email not existing.
- Steps:
  1. Enter `bad-email` as email.
  2. Submit.
- Test Data:
  - email: `bad-email`
- Expected Result:
  - UI blocks submit OR API returns `400`.
  - No DB insert.

### TC-AUTH-004 — Register weak password boundary
- Preconditions: Email not existing.
- Steps:
  1. Set password to minimum-length boundary that should be rejected.
- Test Data:
  - password: `short1!` (example weaker than policy)
- Expected Result:
  - UI/API rejects with password validation error.

### TC-AUTH-005 — Register missing required fields
- Steps:
  1. Leave email empty.
  2. Submit.
- Test Data:
  - email: empty
- Expected Result:
  - `400` with field-specific error.
  - No user created.

### TC-AUTH-006 — Login success
- Preconditions: `user1@example.com` exists with known password.
- Steps:
  1. Open `Login.html`.
  2. Enter credentials.
  3. Submit.
- Test Data:
  - email: `user1@example.com`
  - password: `User@1234`
- Expected Result:
  - Backend returns `200` + JWT.
  - Frontend stores JWT in `localStorage`.
  - User is redirected to `Home.html`.

### TC-AUTH-007 — Login wrong password negative
- Steps:
  1. Login with correct email but wrong password.
- Test Data:
  - password: `Wrong@1234`
- Expected Result:
  - UI shows invalid credentials.
  - JWT is not stored.
  - DB unchanged.

### TC-AUTH-008 — Login missing password field
- Steps:
  1. Submit login with password empty.
- Test Data:
  - password: empty
- Expected Result:
  - `400` validation error.
  - No auth session created.

### TC-AUTH-009 — Protected route denies no JWT
- Preconditions: Not logged in (no JWT in localStorage).
- Steps:
  1. Call a protected API (e.g., cart or orders).
- Test Data: none
- Expected Result:
  - Response `401 Unauthorized`.
  - UI shows auth error/redirect to Login.

### TC-AUTH-010 — Expired/invalid JWT
- Preconditions: Have an invalid JWT string or expired token.
- Steps:
  1. Call protected API with invalid JWT.
- Test Data:
  - token: `invalid.token.value`
- Expected Result:
  - `401` and consistent error JSON shape.

### TC-AUTH-011 — Forgot password success (registered email)
- Preconditions: `user1@example.com` exists.
- Steps:
  1. Open Forgot Password flow (if UI exists) or use API call.
  2. Submit email.
- Test Data:
  - email: `user1@example.com`
- Expected Result:
  - `200` success message.
  - No auth token created (unless specified).

### TC-AUTH-012 — Forgot password unregistered email
- Steps:
  1. Submit `notexists@example.com`.
- Test Data:
  - email: `notexists@example.com`
- Expected Result:
  - Contract respected:
    - Either `404` or “if exists…” generic message.
  - No user record created.

### TC-AUTH-013 — Auth error handling message consistency
- Preconditions: Trigger validation error (missing fields) in login/register.
- Steps:
  1. Submit invalid login payload.
  2. Observe UI error rendering.
- Test Data:
  - email: valid
  - password: empty
- Expected Result:
  - UI shows required field error.
  - API returns 4xx (no 5xx).

### TC-AUTH-014 — Backend rejects malformed JSON
- Steps:
  1. Send invalid JSON body to auth API.
- Test Data:
  - payload: `{bad: json`
- Expected Result:
  - `400` and no DB writes.

### TC-AUTH-015 — Register password with leading/trailing spaces
- Steps:
  1. Register using password with spaces at ends.
- Test Data:
  - password: ` User@1234 `
- Expected Result:
  - Behavior matches backend policy (either trim or reject).
  - No plaintext spaces vulnerability (stored hash uses normalized value if trimming).

### TC-AUTH-016 — Login after password reset invalidates old token (if implemented)
- Preconditions: Password reset flow supports token invalidation.
- Steps:
  1. Login to obtain JWT.
  2. Perform forgot/reset.
  3. Call protected endpoint with old JWT.
- Expected Result:
  - Protected request denied after reset.

---

## Module 2: Product Catalog

### TC-CAT-001 — Category listing loads
- Preconditions: Categories seeded.
- Steps:
  1. Open `Home.html`.
  2. Load categories section.
- Test Data: none
- Expected Result:
  - UI displays seeded categories.
  - API returns `200`.

### TC-CAT-002 — Search matches partial name
- Steps:
  1. Use search box with partial term (e.g., `watch`).
- Test Data:
  - query: `watch`
- Expected Result:
  - Only products whose name/description matches appear.

### TC-CAT-003 — Search case-insensitive
- Steps:
  1. Search for `NeBuLa`.
- Test Data:
  - query: `NeBuLa`
- Expected Result:
  - Same results as `nebula`.

### TC-CAT-004 — Price filter lower boundary
- Steps:
  1. Apply filter `minPrice = 0` (boundary).
- Test Data:
  - minPrice: `0`
- Expected Result:
  - Products priced >= 0 appear (effectively all).

### TC-CAT-005 — Price filter upper boundary exact match
- Steps:
  1. Apply filter `maxPrice = exact seeded price`.
- Test Data:
  - maxPrice: `79.99` (example)
- Expected Result:
  - Products with price exactly 79.99 appear.

### TC-CAT-006 — Brand filter
- Steps:
  1. Select brand `Nebula`.
- Test Data:
  - brand: `Nebula`
- Expected Result:
  - Response contains only products with `brand = Nebula`.

### TC-CAT-007 — Ratings filter threshold boundary
- Steps:
  1. Filter by ratings >= `4.0`.
- Test Data:
  - minRating: `4.0`
- Expected Result:
  - Only products meeting threshold appear.

### TC-CAT-008 — Availability filter in-stock only
- Steps:
  1. Enable availability filter “In stock”.
- Test Data: none
- Expected Result:
  - Out-of-stock products excluded.

### TC-CAT-009 — Sorting low→high price
- Steps:
  1. Select sort “Price: low to high”.
- Test Data: none
- Expected Result:
  - List is ascending by current price.

### TC-CAT-010 — Sorting high→low price
- Steps:
  1. Select sort “Price: high to low”.
- Expected Result:
  - List is descending by current price.

### TC-CAT-011 — Sorting latest
- Steps:
  1. Select sort “Latest”.
- Expected Result:
  - Products ordered by `created_at/updated_at` per contract.

### TC-CAT-012 — Sorting popularity
- Steps:
  1. Select sort “Popularity”.
- Expected Result:
  - Ordered by popularity metric (e.g., review count or order count).

### TC-CAT-013 — Combined filters + search set consistency
- Steps:
  1. Search `phone`.
  2. Apply filters (brand + availability).
- Expected Result:
  - UI count equals API count.
  - Result set equals intersection of predicates.

### TC-CAT-014 — Invalid filter parameters negative price
- Steps:
  1. Set `minPrice = -10`.
  2. Submit filters.
- Expected Result:
  - `400` with validation message; UI shows error.

### TC-CAT-015 — No results returns empty state
- Steps:
  1. Search for `zzzz-no-product`.
- Expected Result:
  - Empty list with friendly message.
  - No server error.

### TC-CAT-016 — Catalog API matches UI fields
- Steps:
  1. Load catalog and compare a product card fields.
- Expected Result:
  - name, price, stock availability, rating summary match API payload/DB aggregation.

---

## Module 3: Product Details Page

### TC-PROD-001 — Description renders
- Preconditions: Product seeded with long description.
- Steps:
  1. Open `Product.html?id=<product_id>`.
- Expected Result:
  - Description displayed fully (no truncation bugs).

### TC-PROD-002 — Multiple images render
- Steps:
  1. Open product with multiple image URLs.
- Expected Result:
  - Thumbnails render and main image updates on click.

### TC-PROD-003 — Reviews summary displays avg + count
- Preconditions: Reviews seeded.
- Steps:
  1. Open product details.
- Expected Result:
  - UI avg rating equals DB aggregation.
  - UI review count equals DB count.

### TC-PROD-004 — Reviews list loads in correct order
- Steps:
  1. Open product with multiple reviews.
- Expected Result:
  - Ordering matches policy (latest first).

### TC-PROD-005 — Add to cart succeeds in-stock
- Preconditions: User logged in; product stock > 0.
- Steps:
  1. Set quantity 1.
  2. Click “Add to cart”.
- Expected Result:
  - Cart quantity increases.
  - Backend returns `200` and cart_item created/updated.

### TC-PROD-006 — Add to cart rejects quantity > stock
- Preconditions: product stock = 3.
- Steps:
  1. Attempt add quantity 4.
- Expected Result:
  - `409` or `400` stock validation error.
  - Cart not updated.

### TC-PROD-007 — Stock validation enforced on backend
- Steps:
  1. Bypass UI validation by sending API request directly with too-high qty.
- Expected Result:
  - Backend rejects and does not create cart_item.

### TC-PROD-008 — Cart badge updates
- Steps:
  1. Add item from product page.
  2. Observe nav/cart badge.
- Expected Result:
  - Badge reflects updated total qty from API.

### TC-PROD-009 — Price shown equals current catalog
- Steps:
  1. Open product page.
  2. Compare displayed price to catalog API.
- Expected Result:
  - Same value (or within rounding policy).

### TC-PROD-010 — Product fetch fails gracefully
- Steps:
  1. Open `Product.html?id=999999` (non-existing).
- Expected Result:
  - UI shows “Product not found” and no blank page.

### TC-PROD-011 — Reviews submission authenticated allowed
- Preconditions: Logged-in user.
- Steps:
  1. Select rating (e.g., 4).
  2. Enter text.
  3. Submit review.
- Expected Result:
  - Review appears in list.
  - Aggregation updated.

### TC-PROD-012 — Reviews submission unauthenticated blocked
- Preconditions: Not logged in.
- Steps:
  1. Submit review.
- Expected Result:
  - `401` and UI prompts login.
  - No review row created.

### TC-PROD-013 — Duplicate review policy
- Preconditions: user already reviewed product.
- Steps:
  1. Attempt to submit review again (same product/user).
- Expected Result:
  - Either rejects with “already reviewed” OR updates review (based on policy).

### TC-PROD-014 — Edit review updates aggregation
- Steps:
  1. Edit rating from 3 → 5.
  2. Save.
- Expected Result:
  - Rating aggregation reflects updated value.

### TC-PROD-015 — Delete review removes review + aggregation
- Steps:
  1. Delete the review.
- Expected Result:
  - Review disappears.
  - Aggregation recalculated.

### TC-PROD-016 — Access control for editing/deleting review
- Preconditions: Another user has a review for the product.
- Steps:
  1. Login as different user.
  2. Attempt edit/delete that review.
- Expected Result:
  - Forbidden (`403`) or validation error.
  - No changes to DB.

---

## Module 4: Shopping Cart

### TC-CART-001 — Add item from catalog
- Preconditions: Logged-in user.
- Steps:
  1. Add product to cart from catalog UI.
- Expected Result:
  - Cart has cart_items row with qty 1.

### TC-CART-002 — Add same item increments qty
- Preconditions: cart already contains product with qty 1.
- Steps:
  1. Add same product again qty 1.
- Expected Result:
  - qty becomes 2.

### TC-CART-003 — Add item with other items preserves totals
- Steps:
  1. Add product A to cart.
  2. Add product B.
- Expected Result:
  - total = (A qty * A price snapshot/live) + (B qty * B price ...) per contract.

### TC-CART-004 — Remove item
- Steps:
  1. From `Cart.html`, remove item.
- Expected Result:
  - cart_items row deleted.
  - total recalculated.

### TC-CART-005 — Update quantity within stock
- Steps:
  1. Set quantity to a valid number.
  2. Save/update.
- Expected Result:
  - qty updated and total recalculated.

### TC-CART-006 — Update quantity to 0 policy
- Steps:
  1. Set quantity to 0.
  2. Submit update.
- Expected Result:
  - Either row removed or request rejected; UI matches backend policy.

### TC-CART-007 — Update qty above stock rejected
- Steps:
  1. Set qty > available stock.
- Expected Result:
  - validation error; cart unchanged.

### TC-CART-008 — Price updates policy
- Preconditions: product price changes after item added.
- Steps:
  1. Add to cart.
  2. Change product price via admin (later).
  3. Refresh cart.
- Expected Result:
  - Either totals use snapshot (no change) OR uses current price (changes); verify and lock contract.

### TC-CART-009 — Cart totals match backend computation
- Steps:
  1. Load `Cart.html`.
  2. Compare UI total to `GET /cart/summary` API.
- Expected Result:
  - totals exactly match (currency rounding).

### TC-CART-010 — Rounding boundary
- Preconditions: product price has decimals (e.g., 19.99).
- Steps:
  1. Set quantities producing decimal sums.
- Expected Result:
  - rounding matches backend format (e.g., 2 decimals).

### TC-CART-011 — Cart persists across refresh
- Steps:
  1. Add items.
  2. Refresh browser.
  3. Re-open `Cart.html`.
- Expected Result:
  - cart content still present.

### TC-CART-012 — Unauthenticated cart handled
- Steps:
  1. Visit `Cart.html` without JWT.
- Expected Result:
  - Redirect to Login or API returns `401` and UI handles it.

### TC-CART-013 — Backend prevents inconsistent FK state
- Steps:
  1. Attempt add with invalid product id.
- Expected Result:
  - `400/404`; no cart_item inserted (FK/validation).

### TC-CART-014 — Stock changes between add and checkout
- Steps:
  1. Add to cart qty near stock limit.
  2. Admin reduces stock before checkout.
  3. Proceed to checkout.
- Expected Result:
  - Checkout fails with stock validation; no order created.

### TC-CART-015 — Cart fetch returns availability info
- Steps:
  1. Load `Cart.html`.
  2. Inspect availability badges/flags.
- Expected Result:
  - availability reflects current stock.

### TC-CART-016 — Cart API errors displayed
- Steps:
  1. Force API error (e.g., invalid token).
  2. Load cart.
- Expected Result:
  - UI shows appropriate error state and not stale data.

---

## Module 5: Checkout + Address + Payment Simulation

### TC-CHK-001 — Address form validation required fields
- Preconditions: Logged-in; cart has items.
- Steps:
  1. Open `Checkout.html`.
  2. Submit with empty required fields.
- Expected Result:
  - UI highlights missing fields.
  - API returns `400` if reached.

### TC-CHK-002 — Address boundary max length
- Steps:
  1. Enter max length string for address line.
  2. Submit.
- Test Data:
  - addressLine1: string of length = max policy (e.g., 100 chars)
- Expected Result:
  - Accepts values within max, rejects beyond max (covered by next case).

### TC-CHK-003 — Address reject overflow length
- Steps:
  1. Enter string length = max+1.
  2. Submit.
- Expected Result:
  - validation error; no order created.

### TC-CHK-004 — Checkout requires login
- Steps:
  1. Visit checkout without JWT.
- Expected Result:
  - redirect to Login or `401`.

### TC-CHK-005 — Order review page correct totals
- Steps:
  1. Proceed from address to review.
  2. Compare displayed totals with cart summary API.
- Expected Result:
  - UI totals match backend values (subtotal at least; shipping/tax if modeled).

### TC-CHK-006 — Valid credit card passes (Luhn + expiry)
- Preconditions: Payment fields enabled; cart in stock.
- Steps:
  1. Select Credit Card.
  2. Enter valid card number `4111111111111111`.
  3. Enter valid future expiry and CVV.
  4. Place order.
- Expected Result:
  - Payment success.
  - Order created; payments row exists.
  - Stock decremented.

### TC-CHK-007 — Invalid credit card fails Luhn
- Steps:
  1. Use card number `4111111111111112`.
- Expected Result:
  - payment rejected; order not created; stock unchanged.

### TC-CHK-008 — Expired credit card rejected
- Steps:
  1. Set expiry to past month/year.
- Expected Result:
  - rejected with expiry validation error.

### TC-CHK-009 — Credit card insufficient funds
- Steps:
  1. Use card number reserved for insufficient funds (policy example: ends with `0000`).
  2. Submit.
- Test Data:
  - cardNumber: `4000000000000002` (Luhn-valid) with insufficient-funds rule enabled by ending pattern `0002` if used; adjust to implemented policy.
- Expected Result:
  - payment failure; order not created; stock unchanged.

### TC-CHK-010 — Debit card valid passes
- Steps:
  1. Select Debit card.
  2. Use valid number `4012888888881881` (Luhn-valid).
  3. Valid expiry/CVV.
- Expected Result:
  - payment success and order created.

### TC-CHK-011 — Debit invalid fails
- Steps:
  1. Debit card with invalid Luhn number.
- Expected Result:
  - payment failure; no stock decrement.

### TC-CHK-012 — Valid UPI `@ybl`
- Steps:
  1. Select UPI.
  2. Enter `name@ybl` format.
- Expected Result:
  - payment accepted; order created.

### TC-CHK-013 — Valid UPI `@upi`
- Expected Result:
  - accepted; order created.

### TC-CHK-014 — Valid UPI `@oksbi` and `@okhdfc`
- Steps:
  1. Try `name@oksbi`.
  2. Try `name@okhdfc`.
- Expected Result:
  - both accepted (two sub-steps validated separately).

### TC-CHK-015 — Invalid UPI provider/format rejected
- Steps:
  1. Enter `name@unknownbank`.
  2. Enter malformed like `name`.
- Expected Result:
  - validation error; order not created.

### TC-CHK-016 — Payment failure does not decrement stock
- Steps:
  1. Attempt checkout with invalid payment.
  2. Fetch product stock from DB/API.
- Expected Result:
  - stock equals pre-checkout value.

---

## Module 6: Orders Module

### TC-ORD-001 — Order history loads
- Preconditions: logged-in customer with at least one order.
- Steps:
  1. Open `Orders.html`.
- Expected Result:
  - list shows user’s orders only.

### TC-ORD-002 — Order history empty state
- Preconditions: new user with no orders.
- Steps:
  1. Open `Orders.html`.
- Expected Result:
  - empty state message shown; no error.

### TC-ORD-003 — Order details loads line items
- Steps:
  1. Open order detail view.
- Expected Result:
  - order_items match DB for that order.

### TC-ORD-004 — Cancel eligible order
- Preconditions: order status is cancellable.
- Steps:
  1. Click cancel order.
- Expected Result:
  - order status updates (e.g., `CANCELLED`).
  - stock restored.
  - payment record reflects refund simulation state if implemented.

### TC-ORD-005 — Cancel ineligible order rejected
- Preconditions: order already shipped/delivered.
- Steps:
  1. Attempt cancel.
- Expected Result:
  - `400/409`; status unchanged.

### TC-ORD-006 — Return eligible order
- Preconditions: order delivered and return-eligible.
- Steps:
  1. Click return order.
- Expected Result:
  - return status updated.
  - refund simulation executed.

### TC-ORD-007 — Return ineligible rejected
- Preconditions: not delivered or already returned.
- Expected Result:
  - request denied; no refund created.

### TC-ORD-008 — Refund simulation updates payment status
- Steps:
  1. Trigger return/refund.
  2. Fetch payment record.
- Expected Result:
  - payment status becomes `REFUNDED` (or similar).

### TC-ORD-009 — Invalid order id returns 404
- Steps:
  1. Open order detail with non-existing id.
- Expected Result:
  - `404` and UI error.

### TC-ORD-010 — Access control other user orders
- Preconditions: Two users exist.
- Steps:
  1. Login as user2.
  2. Request user1 order id.
- Expected Result:
  - `403/401`; no data leak.

### TC-ORD-011 — Cancel/return cannot overshoot stock
- Steps:
  1. Cancel order.
  2. Ensure stock increased exactly qty shipped.
- Expected Result:
  - stock equals original stock + returned qty (no double restore).

### TC-ORD-012 — Orders aggregation equals subtotal
- Steps:
  1. Compare `orders.subtotal` with sum(order_items.price*qty).
- Expected Result:
  - matches exactly (rounding rules same).

### TC-ORD-013 — UI reflects changes after action
- Steps:
  1. Cancel from UI.
  2. Refresh Orders page.
- Expected Result:
  - status shown matches backend.

### TC-ORD-014 — Refund simulation records refund reference
- Steps:
  1. Trigger return.
  2. Check payments table fields.
- Expected Result:
  - refund transaction metadata exists (even if simulated).

### TC-ORD-015 — Cancel triggers payment update only once
- Steps:
  1. Attempt cancel multiple times (rapid).
- Expected Result:
  - idempotency policy respected; no duplicate stock restore/refund.

### TC-ORD-016 — Stock-safe order creation from checkout snapshot
- Steps:
  1. Add to cart qty.
  2. Reduce stock in admin.
  3. Attempt checkout.
- Expected Result:
  - checkout fails; order not created.

---

## Module 7: Ratings & Reviews

### TC-REV-001 — Submit review rating minimum boundary
- Preconditions: logged-in user.
- Steps:
  1. Enter minimum allowed rating (e.g., 1).
  2. Enter valid text.
  3. Submit.
- Expected Result:
  - review saved; avg recalculated.

### TC-REV-002 — Submit review rating maximum boundary
- Expected Result:
  - accepted; aggregation correct.

### TC-REV-003 — Submit review empty text rejected
- Steps:
  1. Leave review text empty.
  2. Submit.
- Expected Result:
  - validation error; no review row.

### TC-REV-004 — Submit review invalid rating rejected
- Steps:
  1. Enter rating outside allowed range (0 or 6).
- Expected Result:
  - `400` validation error.

### TC-REV-005 — Submit review unauthenticated blocked
- Expected Result:
  - `401` and no review created.

### TC-REV-006 — Submit review updates aggregation
- Steps:
  1. Submit a new review for product.
  2. Refresh product details.
- Expected Result:
  - avg and count updated in UI and API.

### TC-REV-007 — Edit review by owner allowed
- Preconditions: user’s existing review for product.
- Steps:
  1. Edit rating and text.
  2. Submit edit.
- Expected Result:
  - review updated; aggregation reflects new rating.

### TC-REV-008 — Edit review with invalid rating rejected
- Steps:
  1. Set rating out of bounds.
- Expected Result:
  - edit denied; review unchanged.

### TC-REV-009 — Delete review by owner allowed
- Steps:
  1. Delete review.
- Expected Result:
  - review removed; count decremented.

### TC-REV-010 — Delete review unauthenticated blocked
- Expected Result:
  - `401`; no deletion.

### TC-REV-011 — Edit/delete review by non-owner forbidden
- Preconditions: review exists by other user.
- Steps:
  1. Login as different user.
  2. Attempt edit/delete.
- Expected Result:
  - `403`; DB unchanged.

### TC-REV-012 — Duplicate review policy
- Preconditions: policy allows one review per user/product.
- Steps:
  1. Submit again for same product.
- Expected Result:
  - either rejected or converted to edit (match contract).

### TC-REV-013 — Rating calculation rounding boundary
- Steps:
  1. Create reviews to produce avg around midpoint (e.g., 4.49 vs 4.50).
- Expected Result:
  - UI shows rounded value per spec.

### TC-REV-014 — Reviews list ordering after new review
- Steps:
  1. Add new review.
  2. Verify it appears at top (latest-first).
- Expected Result:
  - ordering updated.

### TC-REV-015 — UI error handling on review API failure
- Steps:
  1. Disable backend or send malformed payload.
  2. Submit review.
- Expected Result:
  - UI shows error message and does not crash.

### TC-REV-016 — DB aggregation query matches UI values
- Steps:
  1. Compare UI avg/count with running DB aggregation query results.
- Expected Result:
  - exact match (within rounding).

---

## Module 8: Admin Dashboard

### TC-ADM-001 — Admin login required
- Preconditions: non-admin user logged in.
- Steps:
  1. Open admin endpoints.
- Expected Result:
  - `403` denied.

### TC-ADM-002 — Create product success
- Preconditions: Admin logged in.
- Steps:
  1. Fill product form (name, category, brand, price, stock, images).
  2. Submit create.
- Expected Result:
  - `201 Created`.
  - Product appears in catalog.

### TC-ADM-003 — Create product missing required fields
- Steps:
  1. Submit without price or name.
- Expected Result:
  - `400` validation error; product not created.

### TC-ADM-004 — Create product rejects invalid price
- Steps:
  1. Enter negative price or non-numeric.
- Expected Result:
  - validation error.

### TC-ADM-005 — Update product stock and price
- Steps:
  1. Update stock from 10 → 12.
  2. Update price.
- Expected Result:
  - DB updated; catalog reflects changes.

### TC-ADM-006 — Delete product removes from catalog
- Steps:
  1. Delete product.
  2. Refresh catalog.
- Expected Result:
  - product no longer returned by product APIs.
  - Existing cart behaviors (policy) verified (e.g., remove from cart or block checkout).

### TC-ADM-007 — Admin manages orders list
- Steps:
  1. Open admin orders list.
  2. Open order details.
- Expected Result:
  - shows all orders.

### TC-ADM-008 — Admin cancel eligible order
- Steps:
  1. Cancel from admin.
- Expected Result:
  - order status updated; stock restored.

### TC-ADM-009 — Admin return eligible order triggers refund simulation
- Steps:
  1. Return from admin.
- Expected Result:
  - refund simulated; payment status updated.

### TC-ADM-010 — Admin denies non-admin operations
- Steps:
  1. Attempt create/update/delete as non-admin.
- Expected Result:
  - `403`.

### TC-ADM-011 — Manage users (view + role check)
- Steps:
  1. Open admin users page.
  2. Verify users are listed and role/status fields shown.
- Expected Result:
  - only admin can see.

### TC-ADM-012 — Revenue report correctness
- Steps:
  1. Open revenue report.
  2. Compare totals to DB payment sums for successful payments.
- Expected Result:
  - sums match.

### TC-ADM-013 — Revenue report matches order statuses
- Steps:
  1. Create/cancel/refund orders.
  2. Compare revenue report.
- Expected Result:
  - revenue includes only successful payments per spec.

### TC-ADM-014 — Admin create product reflected in Product details
- Steps:
  1. Create new product via admin.
  2. Open `Product.html` for that product id.
- Expected Result:
  - description, images, rating summary render correctly.

### TC-ADM-015 — DB constraints prevent orphan product/category mappings
- Steps:
  1. Attempt create product with invalid category id.
- Expected Result:
  - validation/DB FK error; product not created.

### TC-ADM-016 — Admin order actions are idempotent
- Steps:
  1. Cancel same order twice.
- Expected Result:
  - second call denied or no-op; no duplicate stock restore.

