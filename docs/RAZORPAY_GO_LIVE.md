# Razorpay Go-Live Checklist

## 1. Test-mode validation

- [ ] Razorpay Test key ID and secret are stored as backend secrets.
- [ ] `RAZORPAY_WEBHOOK_SECRET` is a separate secret configured both in Razorpay and backend.
- [ ] Webhook endpoint is publicly reachable at `/api/payments/webhook` over HTTPS.
- [ ] Events enabled: `payment.authorized`, `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`.
- [ ] Successful test checkout becomes `paymentStatus=PAID` only after provider capture.
- [ ] Invalid signature is rejected.
- [ ] Wrong amount/order/currency is rejected.
- [ ] Closing checkout and reopening reuses the open order.
- [ ] Owner cannot reveal handover PIN before captured payment.
- [ ] Borrower cannot collect with the wrong PIN.
- [ ] Both parties must confirm return before completion.
- [ ] Deposit refund moves through `PROCESSING` and reaches `REFUNDED` from provider result/webhook.
- [ ] Webhook redelivery does not duplicate the business action.
- [ ] A valid webhook is present in `payment_webhook_events` before the endpoint returns 200.
- [ ] Failed inbox events retry and eventually become `PROCESSED` after the underlying issue is fixed.
- [ ] An abandoned `PROCESSING` event is recovered after the stale-processing window.
- [ ] Admin dashboard reports zero webhook backlog before launch.

## 2. Live-mode prerequisites

- [ ] Razorpay account/KYC is approved for Live Mode.
- [ ] Production bank/account details are complete.
- [ ] Backend and frontend are served over HTTPS.
- [ ] Live `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are in the secret manager, not Git.
- [ ] Live webhook uses a production-only webhook secret.
- [ ] `JWT_SECRET` is random and at least 32 bytes.
- [ ] `REFRESH_COOKIE_SECURE=true`.
- [ ] `AUTH_REQUIRE_EMAIL_VERIFICATION=true`.
- [ ] `ALLOWED_EMAIL_DOMAINS` contains only intended institutions.
- [ ] PostgreSQL backups and monitoring are configured.

## 3. First live transaction

Use the smallest permitted real transaction and verify all three sources agree:

1. Razorpay dashboard payment is captured.
2. `payment_attempts.status` is `CAPTURED`.
3. `rental_transactions.payment_status` is `PAID` with matching order/payment IDs.

Do not hand over an item based only on a browser success screen.

## 4. Refund verification

After a completed rental, release the deposit and verify:

- `razorpay_refund_id` is persisted.
- status is `PROCESSING` or `REFUNDED` based on provider result.
- `refund.processed` webhook finalizes `REFUNDED`.
- a second refund attempt is blocked.

