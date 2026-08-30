# 🌸 CampusShare — Banasthali Vidyapith Placement-Ready Marketplace

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![Spring Boot 3.5](https://img.shields.io/badge/Spring%20Boot-3.5.16-brightgreen.svg?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1-purple.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Security: BCrypt + JWT](https://img.shields.io/badge/Security-BCrypt%20%2B%20JWT-red.svg?style=flat-square)](https://spring.io/projects/spring-security)
[![Campus](https://img.shields.io/badge/Campus-Banasthali%20Vidyapith-pink.svg?style=flat-square)](https://banasthali.org/)
[![CI Status](https://img.shields.io/badge/CI-Passing%20✓-success.svg?style=flat-square)]()

> **CampusShare** is a production-grade, placement-ready peer-to-peer rental and buy/sell marketplace designed exclusively for the **Banasthali Vidyapith** student community. Students can list items, borrow essentials (scientific calculators for AIM & ACT exams, lab gear, cycles for campus commutes, hostel essentials), negotiate or chat in real-time, pay securely via Razorpay/UPI/Cash, perform double-confirmed handovers at safe campus spots (Central Library Gate, Shakuntala Canteen, Hostels), and build a verified student reputation.

---

## 🏛️ Banasthali Vidyapith Campus Features

- **🎓 Campus Identity**: Exclusively tailored for Banasthali departments (*AIM & ACT, WISDOM, ECE, Biotech, Pharmacy, Mathematics, Design, Aviation*) and `@banasthali.in` email support.
- **🏠 Banasthali Hostels**: Integrated hostel selection across *Shakuntala, Gargi, Maitreyi, Kasturba, Yashoda, Sharda, Vani Mandir, Pragya, Anuradha, Ahilya, Ganga, Yamuna, Saraswati, Gayatri, Lavanya, Meera, Navanidhi, Priyamvada*.
- **📍 Safe Pickup Hotspots**: Pickup spots mapped to campus landmarks (*Central Library Gyan Mandir Gate, AIM & ACT Building, Shakuntala Canteen, Surya Mandir, Apaji Mandir Gate, SBI Campus Branch*).

---

## 🚀 Why this project stands out for Placements

- **Authoritative Server-Side Pricing**: Zero-trust client calculation; Spring Boot independently verifies daily/weekly rates, 5% fee (0% Pro waiver), and deposits.
- **IDOR Protection & Security**: Authenticated `UserPrincipal` ownership checks on all listing modifications and transactions (`AccessDeniedException` $\rightarrow$ `403 Forbidden`).
- **Real Payment Architecture**: Backend-created Razorpay Orders, server HMAC verification, idempotent durable webhook inbox, and refund lifecycle.
- **Safer Authentication**: BCrypt password hashing, short-lived JWT access tokens, rotating SHA-256 refresh tokens in HttpOnly cookies, logout & session revocation.
- **Race-Condition Protection**: Pessimistic row locks + JPA versioning around booking acceptance, handovers, payments, and deposit release.
- **Production Database Discipline**: PostgreSQL + Flyway migrations; strict Bean validation boundaries on all entities.
- **7-Section Responsive Form UI**: Clean visual divider cards with live character counters (`0/120`, `0/2000`).

```text
Secure auth      -> JWT + rotating HttpOnly refresh credential + revocation
Marketplace      -> search + filters + saved items + explainable recommendations
Rental safety    -> overlap checks + pessimistic locking + optimistic versioning
Payments         -> Razorpay Orders + capture validation + durable webhook inbox
Physical trust   -> 6-digit handover PIN + dual return confirmation
After-rental     -> two-sided reviews + trust score + deposit refund lifecycle
Operations       -> moderation dashboard + payment-event queue visibility
Production       -> PostgreSQL + Flyway + Docker + Nginx + CI + Actuator + OpenAPI
```

Start with **`START_HERE.md`**. For interviews, read **`docs/PLACEMENT_DEMO.md`** and **`docs/INTERVIEW_QA.md`**.

---

## Core end-to-end flow

```text
1. Student signs up
   └─> optional college-email verification
       └─> login -> short JWT + HttpOnly rotating refresh cookie

2. Owner lists an item
   └─> borrower selects dates
       └─> backend rejects overlaps / invalid dates / self-rental

3. Owner accepts request
   └─> row locks protect against competing accepts
       └─> secure 6-digit handover PIN generated

4. Borrower clicks Pay
   └─> backend creates/reuses Razorpay Order for exact rent + deposit
       └─> Razorpay Checkout (UPI/cards/netbanking as enabled on account)

5. Payment completion
   ├─> browser callback -> server HMAC verification
   └─> Razorpay webhook -> signature verify -> durable DB inbox -> fast 200
       └─> async retry worker -> authoritative reconciliation
           └─> payment becomes PAID only after provider says CAPTURED

6. Physical handover
   └─> owner reveals PIN only after captured payment
       └─> borrower enters PIN -> rental ACTIVE

7. Return
   ├─> borrower confirms returned
   └─> owner confirms received
       └─> rental COMPLETED

8. Owner releases deposit
   └─> Razorpay refund request
       └─> webhook finalizes REFUNDED / FAILED
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, React Router 7, Axios, CSS |
| Backend | Java 21, Spring Boot 3.5.16, Spring Security, Spring Data JPA |
| Auth | JWT (jjwt 0.12.6), BCrypt, rotating refresh token cookie |
| Database | PostgreSQL 16 production, H2 PostgreSQL-mode local |
| Migrations | Flyway |
| Payments | Razorpay Orders / Payments / Refunds / Webhooks |
| API docs | springdoc OpenAPI 2.8.17 |
| Observability | Spring Boot Actuator |
| Delivery | Docker, Nginx, GitHub Actions |

---

## Repository

```text
CampusShare-Startup-Placement-Edition/
├── .github/workflows/ci.yml
├── campusshare-backend/
│   ├── src/main/java/com/campusshare/
│   │   ├── config/          # Security + OpenAPI
│   │   ├── controller/      # REST endpoints
│   │   ├── dto/
│   │   ├── model/           # Users, items, rentals, payment ledger...
│   │   ├── repository/
│   │   ├── security/        # JWT filter/principal
│   │   └── service/         # Auth, rental, Razorpay, reviews...
│   ├── src/main/resources/
│   │   ├── db/migration/V1__startup_schema.sql
│   │   ├── application.yml
│   │   └── application-prod.yml
│   ├── src/test/
│   ├── .env.example
│   ├── Dockerfile
│   └── pom.xml
├── campusshare-frontend/
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
├── scripts/verify.sh
├── docker-compose.yml
└── README.md
```

---

# Local development

## Prerequisites

- Java **21**
- Apache Maven **3.9+**
- Node.js **22 LTS** (or a Vite-7-compatible Node release)
- npm

### Windows one-click launch

From the project root:

- `run-backend.bat` validates Java/Maven and starts Spring Boot.
- `run-frontend.bat` installs dependencies with `npm ci` when needed and starts Vite.
- `run-all.bat` opens both.

### Manual start

Backend:

```bash
cd campusshare-backend
mvn spring-boot:run
```

Frontend:

```bash
cd campusshare-frontend
npm ci
npm run dev
```

Open `http://localhost:5173`.

Local backend defaults to H2 and does **not** require Razorpay credentials just to test signup/listing/rental-request flows. Real checkout endpoints intentionally refuse to operate until Razorpay keys are configured.

---

# Docker + PostgreSQL

Create a root `.env` only when you need payment/mail settings (never commit it), then:

```bash
docker compose up --build
```

Open `http://localhost:5173`.

Docker Compose runs:

- PostgreSQL 16
- Spring Boot with the `prod` profile and Flyway
- React production build behind Nginx
- `/api` proxied to the backend so browser auth cookies remain same-origin locally

To reset local Docker data:

```bash
docker compose down -v
```

---

# Real Razorpay payment setup

The code supports **actual Razorpay Test or Live API credentials**. There is no fake “simulation payment” that marks a rental paid.

1. Create/activate your Razorpay account.
2. Use **Test Mode keys first**.
3. Copy `campusshare-backend/.env.example` values into your deployment secrets:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

4. Configure your Razorpay webhook endpoint:

```text
https://YOUR_BACKEND_DOMAIN/api/payments/webhook
```

Subscribe to at least:

```text
payment.authorized
payment.captured
payment.failed
refund.processed
refund.failed
```

5. Use the same webhook secret in `RAZORPAY_WEBHOOK_SECRET`.
6. Complete end-to-end Test Mode payments before switching credentials to Live Mode.
7. For real-money payments, your Razorpay account must be live/KYC-enabled and your deployment must use HTTPS + production secrets.

### Payment safety implemented

- Order is created server-side for the exact amount in paise.
- Open unpaid order is reused to reduce accidental parallel payable orders.
- Checkout callback signature uses the **server-known order ID**.
- Backend fetches the provider payment and validates order ID, amount and currency.
- `authorized` payments are captured server-side when needed.
- A rental becomes `PAID` only after `captured` status.
- Webhooks reconcile browser/network failures through a durable inbox.
- Raw signed events are persisted before acknowledgement, event IDs deduplicate redelivery, background processing retries failures, and stale `PROCESSING` events are recovered after a worker crash.
- Every checkout has a `payment_attempts` ledger record.
- Deposit refund stays `PROCESSING` until provider confirmation when asynchronous.

See `docs/RAZORPAY_GO_LIVE.md` for the release checklist.

---

# Authentication model

```text
Login/Signup
   -> 15-minute access JWT returned to frontend
   -> long-lived random refresh credential stored only as HttpOnly cookie
   -> SHA-256 hash of refresh credential stored in DB

Access token expiry
   -> Axios calls /auth/refresh with cookie
   -> backend rotates refresh credential
   -> new access token stored in sessionStorage

Logout / password reset
   -> stored refresh hash revoked
   -> browser cookie cleared
```

Production defaults:

```text
AUTH_REQUIRE_EMAIL_VERIFICATION=true
REFRESH_COOKIE_SECURE=true
```

Use a long random `JWT_SECRET`; do not use the local fallback in production.

---

# Production environment variables

Use `campusshare-backend/.env.example` as the source of truth. Important values:

```text
DATABASE_URL=jdbc:postgresql://...
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
JWT_SECRET=...
CORS_ALLOWED_ORIGINS=https://app.example.com
FRONTEND_URL=https://app.example.com
AUTH_REQUIRE_EMAIL_VERIFICATION=true
REFRESH_COOKIE_SECURE=true
MAIL_ENABLED=true
MAIL_USERNAME=...
MAIL_PASSWORD=...
ALLOWED_EMAIL_DOMAINS=yourcollege.edu
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

Never expose `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, database password, SMTP password or webhook secret to Vite/browser environment variables.

---

# API documentation and health

Local development:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Health: `http://localhost:8080/actuator/health`

Swagger is disabled by default in `prod` and can be selectively enabled using environment variables.

---

# Tests and CI

Backend:

```bash
cd campusshare-backend
mvn clean verify
```

Frontend:

```bash
cd campusshare-frontend
npm ci
npm run lint
npm run build
```

Or from Linux/macOS project root:

```bash
bash scripts/verify.sh
```

GitHub Actions automatically runs backend tests plus frontend lint/build on pushes and pull requests.

Current backend tests cover, among other cases:

- weekly + daily price calculation
- overlapping rental rejection
- exact Razorpay order amount (rent + deposit)
- reuse of an existing open payment order
- captured-payment verification
- amount mismatch rejection
- secure signup/session creation
- refresh-token rotation
- college-domain rejection
- raw Razorpay webhook signature verification + duplicate-event idempotency
- durable webhook worker success/failure retry behavior
- explainable recommendation ranking and cold-start behavior
- two-sided reviews and abuse-report workflow

---

# Recruiter / placement demo

Read `docs/PLACEMENT_DEMO.md` before interviews. The strongest engineering discussion points are:

1. Why browser payment success is not trusted.
2. How webhooks make payment completion resilient to browser/network loss.
3. Why payment attempts are a separate ledger from rental state.
4. How double booking is protected at both business-rule and database transaction levels.
5. Why refresh tokens are HttpOnly + rotated + hashed at rest.
6. Why Flyway + `ddl-auto=validate` is safer than `ddl-auto=update` in production.
7. How the handover PIN and dual return confirmation map physical-world events to a digital state machine.
8. Why the webhook endpoint persists first and processes asynchronously with retries.
9. Why recommendations expose ranking reasons instead of claiming a black-box AI system.

---

# Important production note

This repository is **live-payment-ready**, but no source-code package can itself activate real-money processing. A real-money transaction additionally requires your own approved Razorpay Live account, Live API credentials, webhook configuration, HTTPS deployment and valid bank/KYC setup. Test Mode should be used for development and placement demos.

