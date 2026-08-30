# CampusShare — Technical Interview Q&A & Architectural Deep Dive

This document contains detailed technical interview explanations of the architecture, design choices, database concurrency, payment processing, and security considerations used in CampusShare.

---

### Q1: How does CampusShare achieve a dual-sided peer-to-peer marketplace without separate buyer and seller accounts?
**Answer**:
- In CampusShare, every user entity has the standard role `ROLE_USER` (or `ROLE_ADMIN` for platform moderation).
- Role is contextual per transaction, not global per user:
  - When User $A$ creates an `Item`, they are recorded as `item.owner`.
  - When User $B$ initiates a `RentalTransaction` on that item, User $B$ is `rental.borrower` and User $A$ is `rental.owner`.
  - The same User $A$ can simultaneously borrow an item from User $C$, becoming `rental.borrower` for that separate transaction.
- Queries in `RentalTransactionRepository` partition by perspective:
  - `findByBorrowerIdOrderByCreatedAtDesc(userId)` yields the user's borrowing history.
  - `findByOwnerIdOrderByCreatedAtDesc(userId)` yields the user's lending history.
- The UI exposes unified dashboards (`/dashboard`) and 6-tab activity centers (`/activity`) displaying both perspectives side-by-side.

---

### Q2: How does CampusShare prevent double-booking / date overlaps for the same item during concurrent requests?
**Answer**:
- **Pessimistic Locking & Overlap Validation**:
  When a rental request is created or accepted, Spring Data JPA executes a pessimistic write lock:
  ```java
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select i from Item i where i.id = :id")
  Optional<Item> findByIdForUpdate(@Param("id") Long id);
  ```
- **Interval Overlap Query**:
  We verify booking collision using the standard interval intersection logic:
  ```sql
  SELECT COUNT(t) > 0 FROM rental_transactions t
  WHERE t.item_id = :itemId
    AND t.status IN ('ACCEPTED', 'ACTIVE')
    AND t.start_date < :endDate
    AND t.end_date > :startDate
  ```
- If a collision occurs, the database transaction aborts with a meaningful message, guaranteeing data consistency without race conditions.

---

### Q3: How is payment integrity and idempotent webhook reconciliation handled with Razorpay?
**Answer**:
- **Idempotent Order Creation**:
  Before opening a new order on Razorpay, `PaymentService` checks `PaymentAttemptRepository` for any open, pending attempt matching the required paise amount and currency (`INR`). This avoids duplicate chargeable orders when users reopen checkout modals.
- **HMAC-SHA256 Signature Verification**:
  On checkout completion, the frontend submits `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The backend computes the HMAC-SHA256 hex digest using the server-side API secret and performs a constant-time comparison.
- **Durable Webhook Inbox & Async Processing**:
  Incoming Razorpay webhook payloads are first verified against `X-Razorpay-Signature`, logged to a persistent `PaymentWebhookInbox` entity, and acknowledged immediately with HTTP 200 OK. An asynchronous processor then reconciles captured payments and refunds idempotently, preventing late failure notifications from regressing already-captured payments.

---

### Q4: How is the physical item handover secured between students?
**Answer**:
- When the owner accepts a rental request and the borrower completes the Razorpay payment, the system generates a cryptographically secure 6-digit PIN via `java.security.SecureRandom`.
- The PIN is visible ONLY to the owner via `GET /api/rentals/{id}/handover-pin`.
- When both students meet in person on campus, the borrower inspects the item and requests the PIN from the owner.
- The borrower enters the PIN in their app (`POST /api/rentals/{id}/confirm-collection`). The backend verifies the PIN in constant time (`MessageDigest.isEqual`), transitions the rental to `ACTIVE`, and sets `item.availabilityStatus = RENTED`.
- This ensures neither party can falsely claim or dispute item collection.

---

### Q5: How are security deposits handled and refunded?
**Answer**:
- If an item requires a security deposit, the deposit is charged alongside the rental fee in the initial Razorpay payment.
- The funds are securely held in captured payment state.
- When both borrower and owner confirm physical return of the item in good condition, the rental transitions to `COMPLETED`.
- The owner can then trigger `POST /api/payments/rentals/{id}/refund-deposit`. The backend calls Razorpay's refund API (`gateway.refund(paymentId, depositPaise, rentalId)`) and returns the exact deposit amount directly back to the student's original payment method (UPI / Card / NetBanking).
