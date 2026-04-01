# Neo Gadgets Capstone

This repository contains an end-to-end e-commerce Quality Engineering (QE) capstone project with:
- Frontend: **Pure HTML + CSS + JavaScript** (no frameworks, no TypeScript)
- Backend: **Node + Express + MySQL** (MVC architecture, JWT auth, input validation, payment simulation, stock-safe checkout)
- Database: **MySQL schema + seed data + validation queries**
- QE Deliverables: STLC test strategy/plan/scenarios/cases, manual test templates, and Playwright automation framework

## Project Structure
- `/frontend` — HTML pages + shared JS + responsive CSS
- `/backend` — Express API (MVC: controllers/routes/models/services)
- `/database` — `schema.sql`, `seed.sql`, and `validation_queries.sql`
- `/documentation` — `test-strategy`, `test-plan`, `test-scenarios`, `test-cases`, `test-data`, `test-execution`, `defects`
- `/automation` — Playwright framework (POM) + specs

## Setup
1. Create MySQL DB and run:
   - `database/schema.sql`
   - `database/seed.sql`
2. Configure backend environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Set `DB_USER`, `DB_PASSWORD`, and `JWT_SECRET` (recommended)
3. Run backend:
   - `cd backend`
   - `npm run start`
4. Open frontend:
   - Backend serves static pages automatically at `http://localhost:3000/`

## Backend Endpoints (High-level)
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/forgot`
- Catalog: `/api/catalog/categories`, `/api/catalog/products`
- Products: `/api/products/:id`
- Cart: `/api/cart/summary`, `/api/cart/items`
- Checkout: `/api/checkout/place`
- Orders: `/api/orders`, `/api/orders/:id/cancel`, `/api/orders/:id/return`
- Reviews: `/api/reviews/:productId` (POST/PATCH/DELETE)
- Admin (admin only): `/api/admin/*`

## Run Playwright Automation
- Ensure backend + MySQL are running.
- Run:
  - `npm run test:e2e`
  - HTML report generated under `automation-report/`

## Notes
- Payment is simulated deterministically:
  - Card passes: Luhn + non-expired + not ending with `0000`
  - UPI passes: `@ybl/@upi/@oksbi/@okhdfc`
- Checkout clears cart items after successful order.

