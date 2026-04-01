# Automation Architecture (Playwright + POM)

```mermaid
flowchart LR
  UI[Tested Pages (HTML/CSS/JS)] --> POM[POM Layer (Page Objects)]
  POM --> UTIL[Utils (wait/assert/logger)]
  UTIL --> TESTS[Data-driven Specs]
  TESTS -->|HTTP setup| API[Backend APIs (/api/*)]
  API --> DB[MySQL (seeded data + constraints)]
  TESTS --> REPORT[HTML Reports (Playwright)]
```

## Key Components
- `/automation/pom`
  - `BasePage.js`: common navigation helpers and localStorage token init.
  - `pages/*`: page objects per module (Login, Home, Product, Cart, Checkout, Orders, AdminProducts).
  - `utils/*`: logging, wait helpers, and shared assertions.
- `/automation/tests`
  - Spec files that exercise end-to-end flows.
  - Fixtures in `tests/fixtures/*` to provide tokens and pre-authenticated `localStorage` state.
- `/automation/playwright.config.js`
  - Runs tests in parallel and generates an HTML report.

## Parallel Execution
- `fullyParallel: true`
- `workers: 4` by default (override with `WORKERS` env var)

## Data-Driven Testing
- Payment and filter validations can be parameterized via arrays inside test files.

