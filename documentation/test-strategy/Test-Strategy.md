## Neo Gadgets QE Test Strategy (End-to-End)

### Scope
This strategy covers end-to-end quality validation for the Neo Gadgets store, including:
1. Frontend (HTML/CSS/JS only) UI, client-side validation, dynamic DOM updates.
2. Backend (Node + Express + MySQL) APIs, JWT auth, input validation middleware, payment simulation, and stock-safe ordering.
3. Database correctness (schema constraints, CRUD integrity, joins, cart/order/payment/review consistency).
4. Manual testing (STLC phases) and Playwright automation (POM, data-driven, parallel).

### Scope & Objectives
Primary objectives:
- Verify core e-commerce flows work end-to-end: auth → browse → product details → cart → checkout/payment simulation → orders.
- Verify data integrity: stock cannot go negative; totals/aggregations match between UI, API, and DB.
- Verify negative paths: invalid input, insufficient funds, invalid UPI/card, out-of-stock add-to-cart/checkout prevention.
- Provide measurable quality outcomes: pass/fail rates, defect density, and regression coverage.

### Test Levels
1. Unit
   - Payment validation service (card/UPI checks), JWT middleware behavior, stock calculation helpers.
   - SQL utility functions and validation logic.
2. Integration
   - API route + service + DB interaction (e.g., checkout writes orders + payments atomically with stock checks).
3. System
   - Full-stack flows from browser UI through APIs to DB and back.
4. Regression
   - Retest critical flows on every iteration: auth, catalog search/filter/sort, cart/stock, checkout/payment, orders, reviews, admin CRUD.

### Test Types
- Functional
  - Business rules (auth, cart operations, checkout validation, order cancellation/return/refund simulation).
- UI
  - Client-side form validation messages, DOM updates, responsive layout, navigation/visibility.
- DB
  - Constraints (PK/FK), CRUD integrity, join correctness, totals consistency, stock constraints.
- Negative & Error Handling
  - Invalid payloads, authorization failures, validation errors, payment invalid scenarios.
- Boundary & Decision Table
  - Price/rating thresholds, quantity boundaries, card/UPI format boundaries, stock boundary conditions.

### Risks & Mitigation
1. Risk: Payment validation rules may be ambiguous.
   - Mitigation: Encode deterministic rules in the payment validation service and mirror them in tests.
2. Risk: Stock/race conditions during checkout could allow overselling.
   - Mitigation: Checkout transaction with row-level locking (or atomic update pattern) and DB constraints.
3. Risk: UI and DB totals drift (tax/shipping not modeled).
   - Mitigation: Single source of truth for totals (API), UI only renders API-computed totals.
4. Risk: JWT expiry/invalid tokens cause inconsistent error shapes.
   - Mitigation: Standardize error response format and assert it in tests.
5. Risk: Reviews aggregation and rating calculations mismatch.
   - Mitigation: Use DB aggregation queries and validate via UI + API + DB queries.

### Exit Criteria (Definition of Done)
- All smoke tests pass (manual + Playwright smoke suite) for auth, catalog, cart, checkout, orders, reviews, admin.
- No critical or high severity defects open for the release.
- Regression suite passes for at least the “core path” set.
- Evidence exists: at least one execution report and sample defect report filled.

### References / Evidence Artifacts
- `documentation/test-plan/Test-Plan.md`
- `documentation/test-scenarios/Test-Scenarios.md`
- `documentation/test-cases/Test-Cases.md`
- `documentation/test-execution/Test-Execution-Report.md`
- `documentation/defects/Defect-Report-Template.md`
- `automation/tests/*` and `playwright.config.js`

