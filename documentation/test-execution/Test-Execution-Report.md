# Neo Gadgets Manual Testing Execution Report (STLC Phase 3)

## Release/Build Details
- Build/Release Name: `Neo Gadgets Capstone v0.1`
- Version: `alpha`
- Date: `YYYY-MM-DD`
- Test Environment:
  - Frontend: `Chrome/Edge latest`
  - Backend: `Node + Express`
  - DB: `MySQL`

## Test Scope for Manual Execution
- Smoke coverage: Auth, Catalog, Product Details, Cart, Checkout/Payment, Orders, Reviews, Admin.
- Negative coverage: invalid auth, invalid filters, payment invalid/insufficient funds, out-of-stock prevention.

## Execution Summary (Populate after running)
- Total Test Cases Executed: `128`
- Passed: `__`
- Failed: `__`
- Blocked: `__`
- Not Run: `__`

## Evidence Checklist
- Screenshots captured for at least:
  - 1 authentication success
  - 1 authentication failure
  - 1 checkout success
  - 1 payment failure (invalid card)
  - 1 stock prevention case
  - 1 admin CRUD reflection in catalog

## Sample Manual Execution Notes Template
### Execution ID: `EXEC-001`
- Test Case IDs Covered: `TC-CAT-002`, `TC-CAT-003`
- Modules: Catalog
- Steps Performed:
  1. Login as `user1@example.com`.
  2. Use search `NeBuLa`.
  3. Validate filters/results.
- Observations:
  - Note any UI/API mismatches.
- Outcome:
  - PASS/FAIL
- Links/Artifacts:
  - Screenshot path(s)

---

## Sample Filled Entry (Example)
### Execution ID: `EXEC-001` (Example)
- Test Case IDs Covered: `TC-CHK-007`, `TC-CHK-008`
- Modules: Checkout + Payment Simulation
- Steps Performed:
  1. Logged in as `user1@example.com`.
  2. Added `product_id=103` to cart.
  3. Entered expired expiry and attempted checkout.
- Observations:
  - UI error banner shows “Payment failed”.
- Outcome:
  - PASS
- Links/Artifacts:
  - Screenshot: `documentation/test-execution/screenshots/EXEC-001.png`

