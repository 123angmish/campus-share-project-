# CampusShare End-to-End Testing Checklist

## Automated verification

```bash
bash scripts/verify.sh
```

This runs Maven backend tests plus a clean frontend install, lint and production build.

## Authentication

- [ ] Sign up with a valid allowed email.
- [ ] Reject invalid/weak credentials and duplicate email.
- [ ] Login returns a short-lived access token and sets the refresh cookie.
- [ ] Refresh rotates the credential; an old refresh credential no longer works.
- [ ] Logout revokes the server session and clears the cookie.
- [ ] Password reset invalidates existing refresh sessions.
- [ ] Production profile requires verified email when enabled.

## Marketplace

- [ ] Verified user can create/update/deactivate their own listing.
- [ ] Another user cannot edit/delete that listing.
- [ ] Public search excludes inactive/flagged listings.
- [ ] Public owner DTO does not expose email, phone, hostel or room.
- [ ] Saved-item flow works.
- [ ] Signed-in home shows explainable recommendations; signed-out home does not make protected recommendation UI visible.

## Rental state machine

- [ ] User cannot rent their own item.
- [ ] Invalid/past date ranges are rejected.
- [ ] Owner can accept/decline only their own incoming request.
- [ ] Competing overlapping accepted/active rentals cannot both win.
- [ ] PIN is unavailable before captured payment.
- [ ] Wrong PIN does not activate rental.
- [ ] Correct PIN activates rental exactly once.
- [ ] One return confirmation does not complete rental.
- [ ] Both confirmations complete it.

## Razorpay Test Mode

- [ ] Backend creates exact `rent + deposit` order in paise.
- [ ] Reopening checkout reuses an open order.
- [ ] Forged callback signature is rejected.
- [ ] Provider order/amount/currency mismatch is rejected.
- [ ] Rental becomes `PAID` only for captured provider state.
- [ ] Closing the browser after payment still converges through webhook processing.
- [ ] Duplicate `X-Razorpay-Event-Id` does not duplicate business effects.
- [ ] Invalid webhook HMAC is rejected before persistence.
- [ ] Valid webhook is stored in `payment_webhook_events` before 200 acknowledgement.
- [ ] Failed/abandoned webhook processing is retried.

## Refund

- [ ] Deposit cannot be released before completed return.
- [ ] Non-owner cannot release deposit.
- [ ] Duplicate refund is blocked.
- [ ] Provider refund ID is persisted.
- [ ] Asynchronous refund reaches `REFUNDED` through reconciliation.

## Trust + moderation

- [ ] Borrower can review once.
- [ ] Owner can review once for the same rental.
- [ ] Same reviewer cannot submit a duplicate review.
- [ ] Reported listing enters moderation workflow.
- [ ] Admin can inspect moderation and webhook backlog metrics.

## Production smoke checks

- [ ] `docker compose up --build` starts PostgreSQL, backend and frontend.
- [ ] Flyway applies schema; Hibernate validates instead of updating it.
- [ ] `/actuator/health` reports healthy.
- [ ] Browser `/api` calls work through same-origin Nginx proxy.
- [ ] No `.env`, API secret, SMTP secret or database password is committed.
