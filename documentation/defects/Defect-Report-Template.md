# Neo Gadgets Defect Report Template

## Defect Overview
- Defect ID: `DEF-___`
- Title: `Short problem summary`
- Module: `Authentication | Catalog | Product | Cart | Checkout | Orders | Reviews | Admin`
- Severity: `S1 (Critical) | S2 (High) | S3 (Medium) | S4 (Low)`
- Priority: `P0 (Urgent) | P1 | P2 | P3`
- Environment:
  - OS: `Windows 10/11`
  - Browser: `Edge/Chrome version`
  - Backend version: `Neo Gadgets Capstone v0.1`
  - DB: `MySQL`

## Description
- What happened:
- Why it matters:

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Test Case References
- Related Test Case ID(s): `TC-___`

## Expected vs Actual
- Expected Result:
- Actual Result:

## Evidence
- Screenshot/Video:
- Backend response logs:
- DB changes (if relevant):

## Defect Lifecycle
- Status:
  - New / Triaged / In Progress / Fixed / Verified / Closed

---

## Sample Filled Defect (Example)
### Defect ID: `DEF-001`
- Title: Checkout accepts invalid credit card without error
- Module: Checkout + Address + Payment Simulation
- Severity: `S2 (High)`
- Priority: `P1`
- Environment:
  - OS: Windows 10
  - Browser: Chrome latest
  - Backend version: ShopEase Capstone v0.1
  - DB: MySQL

## Description
- What happened: UI allowed placement and showed success even when card failed Luhn validation.
- Why it matters: Leads to incorrect orders/payments creation and violates stock safety requirements.

## Steps to Reproduce
1. Login as `user1@example.com`.
2. Add an in-stock product to cart.
3. Open `Checkout.html`.
4. Select `Credit Card` and enter card number `4111111111111112` with expiry `12/2099` and CVV `123`.
5. Click `Place order`.

## Test Case References
- Related Test Case ID(s): `TC-CHK-007`

## Expected vs Actual
- Expected Result: Checkout returns payment failed; order not created; stock unchanged.
- Actual Result: Order created and stock decremented.

## Evidence
- Screenshot/Video: `documentation/defects/screenshots/DEF-001.png`

## Defect Lifecycle
- Status: `Verified / Closed`

