# CampusShare — Start Here

Use this file when opening the project for the first time.

## What makes this more than CRUD

CampusShare models a real campus rental business process from identity to money to physical handover:

1. verified student identity and revocable sessions,
2. searchable listings and explainable personalized ranking,
3. overlap-safe rental requests,
4. owner acceptance under database locking,
5. Razorpay order/capture verification,
6. durable asynchronous webhook reconciliation,
7. secure physical handover using a one-time 6-digit PIN,
8. dual-party return confirmation,
9. security-deposit refund,
10. two-sided reputation + moderation + operational monitoring.

## Fast local demo

Prerequisites: Java 21, Maven 3.9+, Node 22 LTS and npm.

On Windows, run `run-all.bat`. Or start manually:

```bash
cd campusshare-backend
mvn spring-boot:run
```

In another terminal:

```bash
cd campusshare-frontend
npm ci
npm run dev
```

Open `http://localhost:5173`.

The local profile uses H2 so PostgreSQL is not required for the first demo. Payment endpoints remain safely unavailable until Razorpay credentials are configured.

## Verify before demo or submission

Windows:

```bat
verify-project.bat
```

Linux/macOS:

```bash
bash scripts/verify.sh
```

Both run backend tests plus a clean frontend lint/production build.

## Production-like local stack

```bash
docker compose up --build
```

This runs PostgreSQL + Flyway, Spring Boot, and the React/Nginx frontend.

## Before a placement interview

Read these in order:

1. `docs/PLACEMENT_DEMO.md` — 9-minute recruiter demo.
2. `docs/INTERVIEW_QA.md` — architecture questions and short answers.
3. `docs/ARCHITECTURE.md` — deeper system design.
4. `docs/RAZORPAY_GO_LIVE.md` — payment release checklist.
5. `docs/TESTING_CHECKLIST.md` — end-to-end validation matrix.

## One-line pitch

> CampusShare is a production-minded campus rental marketplace where the hard part is not listing an item—it is making identity, payment, handover, return and trust converge safely even under retries, network failure and concurrent actions.
