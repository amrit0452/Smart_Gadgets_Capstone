## Neo Gadgets QE Test Plan (STLC)

### 1) Scope & Objectives
In scope:
- 8 modules (Authentication, Catalog, Product Details, Cart, Checkout/Payment Simulation, Orders, Ratings & Reviews, Admin Dashboard).
- Client-side validation + API validation + DB constraint correctness.
- Stock-safe operations and consistent totals (cart totals → order totals).

Objectives:
- Detect functional defects in business rules.
- Detect UI/UX regressions and DOM update issues.
- Detect DB integrity issues (FK/PK, join correctness, aggregation consistency).
- Validate negative flows (auth failures, invalid payments, out-of-stock prevention).

### 2) In-Scope Environment Assumptions
- Frontend served as static files (HTML/CSS/JS) pointing to backend API base URL.
- Backend running locally with MySQL.
- Test data seeded via seed script.
- API testing can be done via browser + Playwright + (optionally) Postman/cURL.

### 3) Test Levels & Types Mapping
Unit:
- Payment validation service logic (card Luhn, expiry, UPI format/provider).
- Auth validation middleware.
- Stock helper functions.

Integration:
- Checkout transaction: stock check → order + payment insert → stock decrement → order_items insert.
- Reviews write & aggregation read path.

System:
- End-to-end browser flows: Register → Login → Browse → Product → Cart → Checkout → Orders.
- Admin CRUD and revenue report path.

Regression:
- Repeat core path tests per sprint/iteration.
- Run full negative tests for payment and validation on release candidates.

Test types:
- Functional, UI, DB, Negative/Boundary (explicitly included in cases).

### 4) Test Data & Versioning
- Seed script provides deterministic base datasets:
  - Users: at least 1 admin + 2 customers.
  - Categories, Products with controlled stock counts and prices.
  - Reviews and orders (optional initial).
- Tests will rely on stable product IDs and stock levels.
- When tests require state changes (cart/order creation), they use unique users or cleanup via cancel/return paths.

### 5) Entry/Exit Criteria
Entry:
- Frontend pages and backend endpoints implement the contract for each module.
- MySQL schema created and seed script run.

Exit:
- All test cases in `documentation/test-cases/Test-Cases.md` executed for target build.
- Any blocker issues are triaged and tracked in `documentation/defects`.

### 6) Risks & Mitigation (Expanded)
- Risk: Payment simulation could be inconsistent between UI validation and backend validation.
  - Mitigation: UI uses the same deterministic rules as backend docs/tests; backend is source of truth.
- Risk: Stock decrements can mismatch cart updates.
  - Mitigation: checkout recomputes quantities and verifies product stock before decrement.
- Risk: JWT stored incorrectly or expired tokens break flows.
  - Mitigation: Playwright suite includes token expiration invalid token test.

### 7) Deliverables
- Phase 1: this document plus strategy.
- Phase 2: test scenarios and detailed cases + test data sheet.
- Phase 3: manual test execution report + defect report + lifecycle diagram.
- Phase 4-5: Playwright automation framework + scripts + database validation SQL queries + reporting.

