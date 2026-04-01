# Neo Gadgets QA Test Data Sheet

## 0) Deterministic Seed Data Targets
The seed script (later in `/database`) should create at least the following records so test IDs remain stable:

### Users
- Admin user
  - `user_id`: `1`
  - `name`: `Admin`
  - `email`: `admin@example.com`
  - `password`: `Admin@1234`
  - `role`: `admin`
  - `is_active`: `1`
- Customer 1
  - `user_id`: `2`
  - `name`: `User One`
  - `email`: `user1@example.com`
  - `password`: `User@1234`
  - `role`: `customer`
  - `is_active`: `1`
- Customer 2
  - `user_id`: `3`
  - `name`: `User Two`
  - `email`: `user2@example.com`
  - `password`: `User@1234`
  - `role`: `customer`
  - `is_active`: `1`

### Categories
- `category_id`: `1`, `name`: `Wearables`
- `category_id`: `2`, `name`: `Phones`
- `category_id`: `3`, `name`: `Accessories`

### Products
Seed at least 6 products with varied price/ratings/stock:
- Product A (in-stock, high rating)
  - `product_id`: `101`
  - `name`: `Nebula Watch`
  - `brand`: `Nebula`
  - `category_id`: `1`
  - `price`: `79.99`
  - `stock_quantity`: `10`
  - `is_available`: `1`
- Product B (out-of-stock)
  - `product_id`: `102`
  - `name`: `Nebula Band`
  - `brand`: `Nebula`
  - `category_id`: `1`
  - `price`: `19.99`
  - `stock_quantity`: `0`
  - `is_available`: `0`
- Product C (phones, mid rating)
  - `product_id`: `103`
  - `name`: `Pulse Phone X`
  - `brand`: `Pulse`
  - `category_id`: `2`
  - `price`: `599.00`
  - `stock_quantity`: `5`
  - `is_available`: `1`
- Product D (phones, low rating)
  - `product_id`: `104`
  - `name`: `Pulse Phone Lite`
  - `brand`: `Pulse`
  - `category_id`: `2`
  - `price`: `299.50`
  - `stock_quantity`: `20`
  - `is_available`: `1`
- Product E (accessories)
  - `product_id`: `105`
  - `name`: `Orbit Charger 30W`
  - `brand`: `Orbit`
  - `category_id`: `3`
  - `price`: `29.99`
  - `stock_quantity`: `15`
  - `is_available`: `1`
- Product F (accessories low stock)
  - `product_id`: `106`
  - `name`: `Orbit Cable USB-C`
  - `brand`: `Orbit`
  - `category_id`: `3`
  - `price`: `9.99`
  - `stock_quantity`: `3`
  - `is_available`: `1`

### Reviews (for aggregation tests)
Seed reviews for Products 101 and 103:
- For `product_id = 101`:
  - `review_id`: `1`, `user_id`: `2`, `rating`: `5`, `review_text`: `Excellent.`
  - `review_id`: `2`, `user_id`: `3`, `rating`: `4`, `review_text`: `Good value.`
- For `product_id = 103`:
  - `review_id`: `3`, `user_id`: `2`, `rating`: `3`, `review_text`: `Okay.`

## 1) Authentication Test Data
- Valid registration:
  - name: `Test User`
  - email: `user1@example.com` (for duplicate negative; use a different email for fresh)
  - password: `User@1234`
- Invalid emails:
  - `bad-email`
  - `missing-at.example`
- Weak password examples:
  - `short1!`
  - `nocaps123!`

## 2) Catalog/Search/Filter Test Data
- Search queries:
  - `watch`
  - `NeBuLa` (case-insensitivity)
  - `phone`
  - `zzzz-no-product`
- Filter boundaries:
  - `minPrice = 0`
  - `maxPrice = 79.99` (exact match target for Product 101)
  - `minRating = 4.0`
- Negative filters:
  - `minPrice = -10`

## 3) Cart Test Data
- Quantities:
  - valid: `1`, `2`, `3`
  - boundary: `stock_quantity` for Product 106 is `3`
  - invalid: `stock_quantity + 1` (e.g., attempt qty `4` for Product 106)

## 4) Checkout + Payment Simulation Test Data
### Credit/Debit Cards
Use Luhn-valid numbers:
- Valid credit card:
  - `4111111111111111` (Visa test, Luhn-valid)
  - `expiry`: `12/2099`
  - `cvv`: `123`
- Invalid Luhn:
  - `4111111111111112`
- Expired:
  - `4111111111111111`
  - `expiry`: `01/2000`

Insufficient funds scenario (implementation must map deterministically):
- Policy example for seed/tests:
  - Use number ending in `0000` as insufficient funds.
- Luhn-valid insufficient-funds example (must be Luhn-valid for acceptance):
  - `4000000000000002` (Luhn-valid)
  - expiry: `12/2099`
  - cvv: `123`
Note: if your backend uses a different deterministic insufficient-funds rule, update the test data accordingly.

### UPI IDs
Valid provider tags (must match backend’s allowed providers):
- `name@ybl`
- `name@upi`
- `name@oksbi`
- `name@okhdfc`
Example:
- `amrit@ybl`
- `amrit@upi`
- `amrit@oksbi`
- `amrit@okhdfc`
Negative UPI examples:
- `amrit@unknownbank`
- `amrit` (missing `@`)
- `@upi` (missing local part)

## 5) Orders/Test State Data
- Cancellation eligibility depends on order status; seed order statuses for admin/order cancellation tests.
- Return eligibility depends on delivered status (or simulate delivered via admin action later).

## 6) Reviews Test Data
- Minimum rating (boundary): `1`
- Maximum rating (boundary): `5`
- Invalid rating: `0`, `6`
- Invalid text: empty string
- Edit text:
  - Original: `Good value.`
  - Edited: `Actually, still good.`

