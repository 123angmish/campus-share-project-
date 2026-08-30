# 🏆 Top 100 Technical & Placement Interview Questions & Answers
## CampusShare: Banasthali Vidyapith Exclusive P2P Rental & Buy/Sell Marketplace

---

## 📑 TABLE OF CONTENTS
1. [Module 1: Domain, Problem Statement & Product Architecture (Q1 – Q10)](#-module-1-domain-problem-statement--product-architecture-q1--q10)
2. [Module 2: Software Engineering & System Design Patterns (Q11 – Q20)](#-module-2-software-engineering--system-design-patterns-q11--q20)
3. [Module 3: Spring Boot 3.5 & REST API Internals (Q21 – Q30)](#-module-3-spring-boot-35--rest-api-internals-q21--q30)
4. [Module 4: Security, Authentication, JWT, BCrypt & IDOR (Q31 – Q40)](#-module-4-security-authentication-jwt-bcrypt--idor-q31--q40)
5. [Module 5: Database Engineering, JPA, Concurrency & Row Locks (Q41 – Q50)](#-module-5-database-engineering-jpa-concurrency--row-locks-q41--q50)
6. [Module 6: Financial Integrity, Razorpay Payments & Webhooks (Q51 – Q60)](#-module-6-financial-integrity-razorpay-payments--webhooks-q51--q60)
7. [Module 7: Physical Trust, Handover PIN & Safety Mechanisms (Q61 – Q70)](#-module-7-physical-trust-handover-pin--safety-mechanisms-q61--q70)
8. [Module 8: Recommendation Algorithm & Search Engine (Q71 – Q80)](#-module-8-recommendation-algorithm--search-engine-q71--q80)
9. [Module 9: Frontend Engineering (React 19, Vite & Axios Interceptors) (Q81 – Q90)](#-module-9-frontend-engineering-react-19-vite--axios-interceptors-q81--q90)
10. [Module 10: Testing, DevOps, CI/CD, Scalability & Behavioral Defense (Q91 – Q100)](#-module-10-testing-devops-cicd-scalability--behavioral-defense-q91--q100)

---

## 🏛️ MODULE 1: DOMAIN, PROBLEM STATEMENT & PRODUCT ARCHITECTURE (Q1 – Q10)

### Q1: What is CampusShare and what specific problem does it solve?
**Answer**: CampusShare is an exclusive peer-to-peer (P2P) campus rental and marketplace application designed for university ecosystems (specifically Banasthali Vidyapith). Students need items for short durations—such as scientific calculators during AIM & ACT lab exams, lab aprons, cycles for commuting across campus, sports gear, and hostel essentials. Buying new items every semester leads to financial waste and clutter. CampusShare allows students to rent or buy directly from fellow verified students on campus with zero delivery delays, transparent peer payment, double-confirmed handovers, and cryptographic security.

### Q2: Why is CampusShare designed as a closed campus network rather than a public marketplace like OLX or Quikr?
**Answer**: Public marketplaces suffer from trust deficit, high courier logistics costs, counterfeit listings, and strangers meeting in public. In a closed campus network:
1. **Identity & Trust**: Users authenticate with campus identity (e.g. `@banasthali.in` email and verified hostel block).
2. **Zero Logistics / Same-Day Handover**: Students meet directly at familiar campus landmarks (Central Library Gate, Shakuntala Canteen, Surya Mandir).
3. **Accountability**: Academic reputation and mutual campus community accountability drastically reduce fraud and theft.

### Q3: What is the dual-perspective user model in CampusShare?
**Answer**: In CampusShare, every student can act as both a **Lender/Seller** and a **Borrower/Buyer** under a single account. The entity `User` holds a generic role `ROLE_USER`. When User A lists an item, they become `item.owner`. When User B books that item, User B is `rental.borrower`. The same User A can simultaneously rent an item from User C, becoming `rental.borrower` for that transaction.

### Q4: How does the platform generate revenue (Monetization Model)?
**Answer**: CampusShare implements two revenue streams:
1. **Platform Transaction Fee**: A 5% fee calculated automatically on every rental transaction.
2. **CampusShare Pro Subscription**: A recurring subscription pass (₹49/month or ₹199/year) that offers 0% platform fee waiver, a verified Pro crown badge, and free monthly listing spotlight boosts.

### Q5: What are the key entities in your data model?
**Answer**:
- `User`: Student profile, authentication credentials, department, year, hostel block, reputation score, Pro status.
- `Item`: Product metadata, title, description, category, condition, daily/weekly rates, direct buy price, deposit amount, campus pickup location, image URLs.
- `RentalTransaction`: Booking records, dates, calculated duration, item fee, platform fee, deposit, total amount, status, handover PIN.
- `PaymentAttempt`: Audit log of Razorpay orders, payment IDs, currency, and verification status.
- `PaymentWebhookEvent`: Durable inbox for external Razorpay webhook events.
- `ChatMessage`: In-app communication messages between transaction participants.
- `Review`: Two-sided peer ratings and feedback comments.
- `Notification`: In-app alerts for booking updates, payment confirmations, and chat pings.

### Q6: How are Banasthali Vidyapith hostels and locations integrated into the platform?
**Answer**: The frontend and database restrict and suggest authentic Banasthali campus zones:
- **Hostel Blocks**: Shakuntala, Gargi, Maitreyi, Kasturba, Yashoda, Sharda, Vani Mandir, Pragya, Anuradha, Ahilya, Ganga, Yamuna, Saraswati, Gayatri, Lavanya, Meera, Navanidhi, Priyamvada.
- **Academic Blocks & Pickup Hotspots**: AIM & ACT Building, WISDOM, Central Library (Gyan Mandir) Gate, Shakuntala Canteen, Surya Mandir, Apaji Mandir Gate, SBI Campus Branch.

### Q7: What are the primary listing types supported?
**Answer**:
1. `RENT`: Available strictly for short-term and medium-term rentals (charged per day/week).
2. `BUY`: Available for permanent direct purchase.
3. `BOTH`: Allows the borrower to choose whether to rent for N days or buy outright.

### Q8: What happens if an item is rented? Does it remain visible in the marketplace?
**Answer**: When a rental transaction enters `ACTIVE` status (after PIN verification), the backend automatically updates `item.availabilityStatus` to `RENTED`. In the public marketplace search queries, only items with `availabilityStatus = 'AVAILABLE'` are shown by default, preventing duplicate concurrent bookings.

### Q9: How are item conditions categorized and displayed?
**Answer**: Items are categorized with strict enum values:
- `NEW`: Brand new, boxed or unused.
- `LIKE_NEW`: Mint condition, zero cosmetic wear.
- `GOOD`: Lightly used, fully functional.
- `FAIR`: Functional but exhibits visible cosmetic wear.

### Q10: How does CampusShare handle two-sided reviews and reputation scoring?
**Answer**: After a rental is `COMPLETED`, both the borrower and the lender can submit a 1 to 5 star rating with written feedback (`Review`). The user's `reputationScore` is computed as the running weighted average of all received reviews, dynamically adjusting their Trust Tier (`TOP_RATED`, `RELIABLE`, `GOOD_STANDING`).

## 🏗️ MODULE 2: SOFTWARE ENGINEERING & SYSTEM DESIGN PATTERNS (Q11 – Q20)

### Q11: Describe the high-level architecture of CampusShare.
**Answer**: CampusShare follows a modular 3-tier monolithic architecture:
1. **Client Tier**: React 19 Single Page Application (SPA) bundled with Vite 7, styled with responsive custom CSS, communicating over HTTPS via Axios.
2. **Application Tier**: Spring Boot 3.5 REST API running on Java 21, structured into Controllers, Services, Security Filters, and Exception Handlers.
3. **Persistence Tier**: Spring Data JPA with Hibernate ORM, connecting to H2 in local development and PostgreSQL with Flyway schema migrations in production.

### Q12: Why did you choose a Modular Monolith instead of Microservices?
**Answer**:
1. **Domain Cohesion**: User authentication, item listings, bookings, and payments share tight transactional boundaries (e.g. locking an item while booking).
2. **Zero Network Latency & Overhead**: In-process method calls eliminate network hops, serialization overhead, and distributed transaction complexity (2PC / Sagas).
3. **Developer Velocity**: Faster deployment, simplified CI/CD, and single database consistency while maintaining clean internal module boundaries (DTOs and Service interfaces) for future extraction if needed.

### Q13: Explain the DTO (Data Transfer Object) Pattern used in the project.
**Answer**: Entities like `User` and `Item` represent internal database tables with sensitive fields (`password`, `version`, `internalAuditStatus`). Exposing them directly in REST APIs creates over-posting vulnerabilities and JSON recursion. We use strict DTOs (`ItemRequest`, `ItemResponse`, `RentalRequest`, `AuthResponse`) with Bean Validation annotations to decouple client contracts from database entities.

### Q14: Explain the Gateway / Adapter Pattern implemented for Payments.
**Answer**: `RazorpayGateway.java` implements a clean gateway interface that encapsulates Razorpay SDK calls (`RazorpayClient`, `orders.create`, `payments.fetch`, `refunds.create`). If the platform ever switches to Stripe, Cashfree, or PayU, only the Gateway implementation changes; `PaymentService` and `RentalService` remain completely untouched.

### Q15: How is the State Machine Pattern used for rental lifecycles?
**Answer**: `RentalTransaction` follows a strict deterministic state machine:
- `PENDING`: Request created by borrower, awaiting owner approval.
- `ACCEPTED`: Owner approved; handover PIN generated; awaiting payment / handover.
- `ACTIVE`: Payment captured & Handover PIN verified; item physically with borrower.
- `COMPLETED`: Both parties confirmed physical return; deposit refunded.
- `CANCELLED`: Cancelled before handover.
- `DISPUTED`: Issue flagged during return (e.g. item damage).
Invalid state transitions (e.g. `PENDING → COMPLETED`) are explicitly rejected by service-level validation guards.

### Q16: What is the Repository Pattern and how does Spring Data JPA implement it?
**Answer**: The Repository Pattern mediates between the domain and data mapping layers. By extending `JpaRepository<Item, Long>`, Spring Data JPA automatically generates CRUD implementations, pagination support, and derived SQL queries at runtime without requiring boilerplate DAO implementation classes.

### Q17: What is the Singleton Pattern in Spring Boot and where is it applied?
**Answer**: All Spring Beans (Services `@Service`, Repositories `@Repository`, Controllers `@RestController`, Configuration `@Configuration`) are by default Singleton-scoped beans managed by the Spring IoC (Inversion of Control) container. A single instance is instantiated at application startup and injected wherever needed.

### Q18: What is Inversion of Control (IoC) and Dependency Injection (DI)?
**Answer**: IoC transfers the control of object creation and lifecycle management from the developer to the framework container. In CampusShare, we use **Constructor-based Dependency Injection** with Lombok's `@RequiredArgsConstructor`. Constructor injection ensures immutability (`final` fields) and simplifies unit testing with Mockito.

### Q19: Why use Nginx as a reverse proxy in front of Spring Boot and React?
**Answer**:
1. **Same-Origin Routing**: Serves React static files at `/` and proxies `/api/*` requests to Spring Boot on port 8080, completely eliminating cross-origin preflight requests in production.
2. **SSL Termination & Security Headers**: Manages HTTPS certificates and injects security headers (`X-Frame-Options`, `Content-Security-Policy`).
3. **Gzip / Brotli Compression**: Compresses static bundles for sub-second load times.

### Q20: What is the Layered Architecture in CampusShare?
**Answer**:
- **Controller Layer** (`com.campusshare.controller`): Handles HTTP routing, request deserialization, Bean validation, and HTTP response status codes.
- **Service Layer** (`com.campusshare.service`): Implements core business logic, transaction boundaries (`@Transactional`), and security checks.
- **Repository Layer** (`com.campusshare.repository`): Executes queries against database tables.
- **Model Layer** (`com.campusshare.model`): JPA Entities defining schema structure.

## ☕ MODULE 3: SPRING BOOT 3.5 & REST API INTERNALS (Q21 – Q30)

### Q21: What is `@SpringBootApplication` and what three annotations does it combine?
**Answer**: `@SpringBootApplication` combines:
1. `@SpringBootConfiguration`: Marks the class as a configuration source.
2. `@EnableAutoConfiguration`: Auto-configures beans based on classpath dependencies (Tomcat, Jackson, Hibernate).
3. `@ComponentScan`: Scans current package and sub-packages for Spring components.

### Q22: Explain `@RestController` vs `@Controller`.
**Answer**: `@Controller` is used in traditional MVC applications to return view templates. `@RestController` combines `@Controller` and `@ResponseBody`, serializing return objects directly into JSON payloads written to the HTTP response body.

### Q23: How does Centralized Exception Handling work with `@RestControllerAdvice`?
**Answer**: `GlobalExceptionHandler.java` is annotated with `@RestControllerAdvice`. It intercepts exceptions thrown anywhere in the controller layer (e.g. `AccessDeniedException`, `MethodArgumentNotValidException`) and maps them to clean, uniform JSON responses (`{ "success": false, "status": 403, "message": "..." }`).

### Q24: What is `@Transactional` and how does rollback work?
**Answer**: `@Transactional` wraps method execution in a database transaction. If the method completes normally, the transaction commits. If an unchecked exception (`RuntimeException` or `Error`) is thrown, Spring automatically triggers a rollback, preserving ACID transactional integrity.

### Q25: What is Bean Validation (JSR-380 / Jakarta Validation) and how is it triggered?
**Answer**: Annotations like `@NotBlank`, `@Size`, `@Min`, `@Max`, `@PositiveOrZero` placed on DTO fields define validation constraints. In controller methods, `@Valid` triggers validation. If validation fails, Spring throws `MethodArgumentNotValidException`, returning field-by-field error maps with HTTP 400 Bad Request.

### Q26: What is Spring Boot Actuator and what endpoints are exposed?
**Answer**: Spring Boot Actuator provides production-ready monitoring features. In CampusShare, `/actuator/health` provides liveness and readiness probes for containerized environments, and `/actuator/info` exposes build version metadata.

### Q27: How does Spring Boot handle CORS (Cross-Origin Resource Sharing)?
**Answer**: In `SecurityConfig.java`, we configure a `CorsConfigurationSource` bean specifying allowed origins (`http://localhost:3000`, production domain), allowed methods (`GET, POST, PUT, DELETE, OPTIONS`), allowed headers (`Authorization, Content-Type`), and `allowCredentials(true)` for HttpOnly cookies.

### Q28: How is asynchronous processing handled in Spring Boot?
**Answer**: In `PaymentWebhookProcessor.java`, heavy background tasks (email notifications, reconciling webhook queues) are annotated with `@Async` and executed by Spring's managed `ThreadPoolTaskExecutor`, keeping API response times under 50ms.

### Q29: What is the purpose of Flyway in your project?
**Answer**: Flyway is a database migration tool. Instead of relying on Hibernate's `ddl-auto: update` in production, Flyway executes versioned SQL scripts (`V1__startup_schema.sql`, `V2__enhanced_features.sql`) sequentially, guaranteeing deterministic database state across environments.

### Q30: How does Jackson serialize and deserialize Java 8 Date/Time (`LocalDate`, `LocalDateTime`)?
**Answer**: Spring Boot 3 includes `jackson-datatype-jsr310`. Jackson serializes `LocalDate` as ISO-8601 strings (`"YYYY-MM-DD"`) and timestamps as ISO strings (`"YYYY-MM-DDTHH:mm:ss"`), ensuring consistent JSON format between Spring Boot and React frontend.

## 🔒 MODULE 4: SECURITY, AUTHENTICATION, JWT, BCRYPT & IDOR (Q31 – Q40)

### Q31: Why did you choose BCrypt for password hashing instead of SHA-256 or MD5?
**Answer**:
1. **Salt Generation**: BCrypt automatically generates a unique 128-bit cryptographic salt for every password, preventing Rainbow Table attacks.
2. **Adaptive Cost Factor**: BCrypt includes a configurable work factor (cost factor 12, running 4096 rounds of Eksblowfish). This deliberately makes hash computation slow, protecting against GPU/ASIC brute-force dictionary attacks.
3. Fast algorithms like SHA-256 and MD5 are dangerously fast, allowing billions of guesses per second on modern hardware.

### Q32: Explain the complete JWT Authentication workflow in CampusShare.
**Answer**:
1. **Login**: User submits email & password to `POST /api/auth/login`.
2. **Verification**: `AuthenticationManager` authenticates credentials against `CustomUserDetailsService` using BCrypt.
3. **Access Token Generation**: Backend signs a JWT with HMAC-SHA256 containing `userId`, `email`, `role`, and 15-minute expiry.
4. **Refresh Token Generation**: Backend creates a secure random token, stores its SHA-256 hash in database, and sets an `HttpOnly`, `SameSite=Lax` cookie.
5. **Authenticated Requests**: Client attaches `Authorization: Bearer <token>` header to API calls.
6. **Filter Verification**: `JwtAuthenticationFilter` validates token signature, extracts user identity, and populates `SecurityContextHolder`.

### Q33: Why store Refresh Tokens in HttpOnly Cookies instead of localStorage?
**Answer**: Storing tokens in `localStorage` makes them vulnerable to **XSS (Cross-Site Scripting)** attacks—any injected JavaScript snippet can read `localStorage` and exfiltrate it. `HttpOnly` cookies cannot be accessed or read by JavaScript running in the browser, completely shielding long-lived session credentials from XSS theft.

### Q34: What is IDOR and how does CampusShare prevent it in item editing and deletion?
**Answer**: Insecure Direct Object Reference (IDOR) happens when an endpoint accepts an entity ID without checking if the requester owns it.
In `ItemService.java`:
```java
Item item = itemRepository.findById(itemId)
    .orElseThrow(() -> new EntityNotFoundException("Item not found"));
if (!item.getOwner().getId().equals(currentAuthenticatedUser.getId())) {
    throw new AccessDeniedException("You do not have permission to modify this listing");
}
```
If owner ID does not match the authenticated principal ID from Spring Security context, the method immediately aborts with `AccessDeniedException` (HTTP 403 Forbidden).

### Q35: How does Chat Security prevent unauthorized eavesdropping?
**Answer**: In `ChatMessageService.java`, before returning messages for a rental transaction or saving a new message, the service checks:
```java
boolean isParticipant = rental.getBorrower().getId().equals(currentUser.getId()) ||
                        rental.getOwner().getId().equals(currentUser.getId());
if (!isParticipant) {
    throw new AccessDeniedException("You are not a participant in this transaction");
}
```
An attacker guessing transaction IDs cannot view or send messages.

### Q36: What is Token Rotation and why is it implemented on refresh?
**Answer**: When `/api/auth/refresh` is called, the existing refresh token is invalidated in the database and a brand new refresh token is issued in the response cookie. If a refresh token is ever intercepted, the legitimate user's next refresh invalidates the stolen token, detecting reuse and protecting the session.

### Q37: How are Passwords validated upon registration?
**Answer**: `AuthService.java` enforces password complexity rules: minimum 8 characters, at least one uppercase letter (`[A-Z]`), and at least one numeric digit (`[0-9]`), preventing weak credentials.

### Q38: How does CampusShare prevent Cross-Site Request Forgery (CSRF)?
**Answer**:
1. REST APIs are stateless (`SessionCreationPolicy.STATELESS`); access tokens are transmitted via the `Authorization: Bearer` header, which browsers never attach automatically.
2. The refresh cookie uses `SameSite=Lax`, preventing cross-site submission on third-party POST requests.

### Q39: What is Method-Level Security in Spring Security?
**Answer**: Enabled via `@EnableMethodSecurity`. It allows annotations like `@PreAuthorize("hasRole('ADMIN')")` directly on controller methods (`AdminController.java`), ensuring only users with `ROLE_ADMIN` can access moderation actions regardless of URL routing.

### Q40: What happens during Logout?
**Answer**: `AuthService.java` clears the refresh token in the database, removes authentication context, and responds with a cleared `Set-Cookie: campusshare_refresh=; Max-Age=0; Path=/api/auth; HttpOnly`, ensuring neither client nor server retains active credentials.

## 🗄️ MODULE 5: DATABASE ENGINEERING, JPA, CONCURRENCY & ROW LOCKS (Q41 – Q50)

### Q41: Explain Pessimistic Locking vs Optimistic Locking in your booking engine.
**Answer**:
- **Pessimistic Locking** (`@Lock(LockModeType.PESSIMISTIC_WRITE)`): Executes SQL `SELECT ... FOR UPDATE`, placing an exclusive database row lock on the `Item` record during booking acceptance. Competing transactions are blocked until the lock holder commits or rolls back.
- **Optimistic Locking** (`@Version private Long version;`): Relies on version numbers without holding locks. When saving, Hibernate checks `WHERE id = ? AND version = ?`. If another transaction incremented the version in the meantime, Hibernate throws `OptimisticLockException`.

### Q42: Write the SQL query used to detect booking date collisions.
**Answer**:
```sql
SELECT COUNT(t.id) FROM rental_transactions t
WHERE t.item_id = :itemId
  AND t.status IN ('ACCEPTED', 'ACTIVE')
  AND t.start_date < :requestedEndDate
  AND t.end_date > :requestedStartDate;
```
If the count is > 0, the interval overlaps with an existing confirmed booking and the transaction is rejected.

### Q43: What are JPA Entity Relationships used in CampusShare?
**Answer**:
- `User` -> `Item` (`@OneToMany(mappedBy = "owner")`)
- `User` -> `RentalTransaction` (`@ManyToOne` for borrower & owner)
- `Item` -> `RentalTransaction` (`@ManyToOne`)
- `RentalTransaction` -> `ChatMessage` (`@OneToMany`)
- `User` -> `Review` (`@ManyToOne` for reviewer & target user)

### Q44: What is FetchType.LAZY vs FetchType.EAGER?
**Answer**:
- `FetchType.EAGER`: Loads the associated entity immediately via an automatic SQL JOIN.
- `FetchType.LAZY`: Defers loading associated records until the getter is explicitly invoked.
All `@ManyToOne` and `@OneToMany` relationships in CampusShare default to `LAZY` to avoid accidental loading of the entire database into memory.

### Q45: How did you fix the N+1 Query problem?
**Answer**: We use JPQL `JOIN FETCH` queries in `ItemRepository.java`:
```java
@Query("SELECT DISTINCT i FROM Item i LEFT JOIN FETCH i.owner WHERE i.availabilityStatus = 'AVAILABLE'")
List<Item> findAllAvailableWithOwners();
```
This loads items and their associated owners in a single unified SQL query instead of 1 + N queries.

### Q46: What database constraints are applied to the `Item` table?
**Answer**:
- `title`: `VARCHAR(120)`, `NOT NULL`
- `description`: `VARCHAR(2000)`, `NOT NULL`
- `daily_price`: `DECIMAL(10,2)`, `NOT NULL`, `CHECK (daily_price >= 0)`
- `deposit_amount`: `DECIMAL(10,2)`, `DEFAULT 0.00`, `CHECK (deposit_amount >= 0)`
- `availability_status`: `VARCHAR(20)`, `NOT NULL`

### Q47: Why use `BigDecimal` for financial columns instead of `float` or `double`?
**Answer**: `float` and `double` use IEEE 754 floating-point representation, which suffers from binary rounding errors (e.g. 0.1 + 0.2 = 0.30000000000000004). In financial calculations, exact decimal representation is mandatory. `BigDecimal` provides arbitrary-precision arithmetic without rounding drift.

### Q48: What is H2 database and why is it used for development and unit tests?
**Answer**: H2 is a lightweight, high-performance in-memory/file-based Java database. In CampusShare, H2 runs in PostgreSQL compatibility mode (`MODE=PostgreSQL`) for rapid local development and automated CI testing without requiring external database server dependencies.

### Q49: What is JPA Auditing?
**Answer**: Enabled via `@EnableJpaAuditing` and `@EntityListeners(AuditingEntityListener.class)`. Annotations `@CreatedDate` and `@LastModifiedDate` on `createdAt` and `updatedAt` columns automatically populate timestamps on entity insert and update without manual code.

### Q50: How is soft deletion vs hard deletion handled for Items?
**Answer**: Items that have historical rental records cannot be hard deleted due to foreign key constraints and audit compliance. When deleted, `availabilityStatus` is updated to `INACTIVE`, preserving booking history for audit reports.

## 💳 MODULE 6: FINANCIAL INTEGRITY, RAZORPAY & WEBHOOKS (Q51 – Q60)

### Q51: How is a Razorpay Order created securely?
**Answer**: `PaymentService.java` calculates the total authoritative amount in paise (Rupees * 100), generates a unique receipt identifier (`receipt_rental_123`), and calls `razorpayClient.orders.create(orderRequest)`. The returned `order_id` is stored in `PaymentAttempt` and passed to the frontend for checkout initialization.

### Q52: How do you verify Razorpay payment signatures on callback?
**Answer**: The backend computes HMAC-SHA256 of `order_id + "|" + payment_id` using the secret. The computed hex string is compared with client-submitted `razorpay_signature` using constant-time comparison `MessageDigest.isEqual` to prevent timing attacks.

### Q53: What is the Webhook Inbox Pattern and why is it needed?
**Answer**: In CampusShare, `PaymentWebhookInboxService` validates the webhook signature, saves the payload into `PaymentWebhookEvent` table (`status = PENDING`), and returns HTTP 200 OK within 15ms. An asynchronous worker processes and reconciles the event idempotently, guaranteeing zero payment drop.

### Q54: What is Idempotency in payment processing?
**Answer**: If Razorpay sends duplicate webhook events for the same `payment_id`, the system checks `paymentAttemptRepository.findByPaymentId(paymentId)`. If already marked `PAID`, the duplicate event is acknowledged and ignored without double-crediting balances or re-triggering notifications.

### Q55: How does the security deposit refund process work?
**Answer**: When a rental completes and the item is confirmed returned in good condition, `PaymentService.refundDeposit(rentalId)` verifies the captured payment ID and deposit paise amount, calling `razorpayClient.payments.refund(paymentId, refundRequest)` to return funds directly to the original UPI/Card.

### Q56: What happens if a borrower pays via Cash or Offline UPI directly?
**Answer**: CampusShare supports direct peer handover settlement:
1. Borrower clicks "Mark Paid via UPI/Cash" upon physical meeting.
2. Owner receives an instant notification to verify their bank/UPI app.
3. Owner clicks "Confirm Payment Received", transitioning the transaction to `PAID`.

### Q57: How does CampusShare handle failed payment webhooks?
**Answer**: Events in `PaymentWebhookEvent` table maintain `retryCount` and `status` (`PENDING, PROCESSED, FAILED`). If transient database errors occur, the async worker retries up to 5 times with exponential backoff before logging the event for administrative review.

### Q58: How is the 5% Platform Fee calculated?
**Answer**: `Platform Fee = ROUND(Item Rent Amount * 0.05, 2)`. If the listing owner or borrower has an active **CampusShare Pro** membership, the fee multiplier is set to 0.00 (100% discount).

### Q59: What is the purpose of `PaymentAttempt` entity?
**Answer**: `PaymentAttempt` acts as an immutable audit ledger recording every transaction attempt: `orderId`, `paymentId`, `amountPaise`, `currency`, `gatewayStatus`, `errorDescription`, `createdAt`.

### Q60: How do you prevent users from tampering with prices in the payment modal?
**Answer**: The payment modal in React queries `GET /api/rentals/{id}`, receiving the server-calculated `totalAmount`. When initializing the Razorpay SDK, the order ID passed was pre-minted by the backend for that exact paise amount on Razorpay's servers.

## 🤝 MODULE 7: PHYSICAL TRUST, HANDOVER PIN & SAFETY (Q61 – Q70)

### Q61: How does the 6-Digit Cryptographic Handover PIN work?
**Answer**: When the rental request is accepted and paid, the backend generates a random 6-digit PIN using `java.security.SecureRandom`. The PIN is revealed only to the Owner. When meeting at a campus landmark (e.g. Central Library Gate), the borrower inspects the item, gets the PIN from the owner, and enters it in their app to activate the rental.

### Q62: Why is the Handover PIN generated using `SecureRandom` instead of `Math.random()`?
**Answer**: `Math.random()` uses linear congruential generators which are pseudo-random and predictable. `java.security.SecureRandom` uses cryptographic entropy sources (OS entropy `/dev/urandom` or Windows CryptoAPI), preventing attackers from guessing PINs.

### Q63: How does the Dual-Confirmation Return process work?
**Answer**: When rental duration ends, the borrower clicks "Confirm Item Returned". The owner receives a notification, inspects physical condition, and clicks "Confirm Item Received in Good Condition". Only when both parties confirm does status update to `COMPLETED` and deposit release unlocks.

### Q64: What happens if an item is returned damaged or broken?
**Answer**: The owner clicks "Report Issue / Dispute", uploads photo proof and description. The rental transitions to `DISPUTED` and deposit refund is frozen until a campus administrator reviews the dispute in the Admin Dashboard (`/admin`).

### Q65: How are Safe Campus Meeting Spots enforced?
**Answer**: Listing and rental forms suggest populated, well-lit campus landmarks (Central Library Gate, Shakuntala Canteen, Surya Mandir, AIM & ACT Foyer, SBI Branch), discouraging meetings in isolated areas.

### Q66: How does the In-App Notification System work?
**Answer**: `NotificationService.java` creates `Notification` records with priority badges (`INFO, SUCCESS, WARNING, DANGER`) on every event. The navbar badge updates in real time via polling and unread count counters.

### Q67: How does the User Trust Score and Reputation tier system work?
**Answer**: Trust scores range from 0 to 100 based on completed transaction count, verified campus email, average review stars (>= 4.5), and zero dispute strikes. Trust tiers include `TOP_RATED`, `RELIABLE`, and `NEW_STUDENT`.

### Q68: How do you prevent self-renting (user renting their own item)?
**Answer**: In `RentalService.java`:
```java
if (item.getOwner().getId().equals(borrowerId)) {
    throw new IllegalArgumentException("You cannot rent your own item");
}
```
The request is rejected with HTTP 400 Bad Request.

### Q69: How is User Contact Information shared safely?
**Answer**: Phone numbers and room numbers are hidden from public browsing. Contact details are revealed to the other student only after a rental request is mutually `ACCEPTED`.

### Q70: What administrative moderation controls exist?
**Answer**: Campus admins (`ROLE_ADMIN`) have access to `/admin` dashboard to view platform analytics, monitor dispute reports, ban fraudulent accounts, and inspect webhook processing logs.

## 🤖 MODULE 8: RECOMMENDATION ALGORITHM & SEARCH (Q71 – Q80)

### Q71: Explain the formula behind CampusShare's Recommendation Engine.
**Answer**: `RecommendationService.java` calculates a multi-factor score:
`Score = (0.35 * Intent) + (0.25 * Trust) + (0.20 * Demand) + (0.20 * Freshness)`
- **Intent (0.35)**: Checks if item category matches student's recent wishlist or rental history.
- **Trust (0.25)**: Owner reputation score (>= 4.5 stars).
- **Demand (0.20)**: Booking request frequency for that category.
- **Freshness (0.20)**: Recency of listing creation (decay factor over 30 days).

### Q72: Why use a Multi-Factor Heuristic Algorithm instead of Deep Learning?
**Answer**:
1. **Zero Cold Start Problem**: Machine Learning models need millions of data points; heuristic scoring works accurately from day one.
2. **Explainability**: Enables human-readable recommendation tags (`✦ High demand for AIM & ACT lab exams`).
3. **Sub-10ms Latency**: Executes directly in memory and SQL without external ML model inference latency.

### Q73: How does Marketplace Search & Filtering work?
**Answer**: `ItemRepository.java` uses dynamic Spring Data JPA Specifications and JPQL queries supporting full-text search on `title` and `description`, category filtering, condition filtering, location matching, price range boundaries, and sorting.

### Q74: What is SQL Injection and how is search protected against it?
**Answer**: SQL Injection occurs when raw user strings are concatenated into SQL queries. Spring Data JPA uses parameterized queries (`PreparedStatement`) where user inputs are treated strictly as literal parameter values.

### Q75: How does Wishlist / Saved Items work?
**Answer**: `WishlistItem` entity maps `userId` and `itemId` with a unique composite constraint (`user_id, item_id`). Students can toggle heart icons on any listing to bookmark items on `/saved`.

### Q76: How does category facet filtering work?
**Answer**: `CategoryController.java` aggregates count of available items per category (`CALCULATOR, ELECTRONICS, CYCLE, LAB_EQUIPMENT, BOOKS`), returning dynamic badge counts to the frontend.

### Q77: How are search queries paginated?
**Answer**: Spring Data JPA's `Pageable` (`PageRequest.of(page, size, Sort.by(...))`) is used in `ItemRepository`. It issues SQL `LIMIT` and `OFFSET` clauses, avoiding memory exhaustion when querying large listing collections.

### Q78: How are recommended items distinguished from regular search results?
**Answer**: Recommended items return a `recommendationReason` string (e.g. `"Frequently rented in your hostel"`, `"Top-rated seller in AIM & ACT"`) that renders as an illuminated chip in the frontend UI.

### Q79: How does location-based sorting work?
**Answer**: Items listed near the student's selected hostel or department are given a matching score boost, sorting nearby items higher in the feed.

### Q80: How does price filtering validate bounds?
**Answer**: Backend validates `minPrice <= maxPrice` and `minPrice >= 0` using Bean validation; invalid bounds throw a descriptive `ValidationException` (HTTP 400).

## ⚛️ MODULE 9: FRONTEND ENGINEERING (REACT 19, VITE & UX) (Q81 – Q90)

### Q81: Why did you choose React 19 and Vite 7 over Create React App (CRA)?
**Answer**: CRA is deprecated and uses Webpack. Vite uses native browser ES Modules and `esbuild` in Go, providing instant cold server start (~300ms) and fast Hot Module Replacement (HMR).

### Q82: How does Global State Management work without Redux?
**Answer**: We use React's built-in **Context API** (`AuthContext.jsx`) with custom hook (`useAuth`). It exposes `user`, `login()`, `signup()`, `logout()` throughout the component tree without external state library overhead.

### Q83: Explain the Axios Response Interceptor for Token Refresh.
**Answer**:
1. Axios interceptor catches HTTP `401 Unauthorized`.
2. It sets `originalRequest._retry = true`.
3. It calls `/api/auth/refresh` (sending the HttpOnly refresh cookie automatically).
4. On receiving new access token, it sets `Authorization: Bearer <newAccessToken>`.
5. It replays the original failed request seamlessly without logging out the user.

### Q84: How is the 7-Section List Item Form structured in `CreateItem.jsx`?
**Answer**: The listing form is organized into 7 clear visual section cards:
1. Listing Type & Marketplace Status
2. Item Information (with live character counters 0/120 and 0/2000)
3. Pricing & Security Deposit
4. Rental Rules & Duration Limits
5. Campus & Pickup Location
6. Product Details & Specs
7. Photos & Image Uploads (up to 6 photos)

### Q85: How do real-time character counters enhance user experience?
**Answer**: Inputs for `title` (max 120) and `description` (max 2000) display live counters. When users approach the limit (>90%), the badge turns amber/red, preventing backend constraint violation errors.

### Q86: How is Protected Routing implemented in React Router?
**Answer**: A custom `ProtectedRoute` wrapper checks `user` in `AuthContext`. If unauthenticated, it redirects to `/login`. Admin routes (`/admin`) verify `user.role === 'ADMIN'`.

### Q87: How are Image Uploads managed on the client side?
**Answer**: `ImageUploader.jsx` supports drag-and-drop, validates file formats (JPEG, PNG, WebP) and file sizes (< 5MB), generates instant preview thumbnails via `URL.createObjectURL`, and supports deletion before submission.

### Q88: What is React Hook `useCallback` and why is it used in `Home.jsx`?
**Answer**: `useCallback` memoizes the `fetchItems` function definition across re-renders, preventing unnecessary function re-instantiations and ensuring `useEffect` runs only when search filters change.

### Q89: How is Mobile Responsiveness achieved?
**Answer**: Using CSS Grid (`repeat(auto-fit, minmax(280px, 1fr))`), flexbox layouts, CSS variables, and media queries (`@media (max-width: 768px)`), ensuring seamless operation on smartphones and laptops.

### Q90: How does the frontend handle payment status polling and modal feedback?
**Answer**: `PaymentModal.jsx` embeds the official Razorpay Checkout SDK script dynamically, opens the checkout dialog with student pre-fills, and displays animated loading/success states on payment capture.

## 🚀 MODULE 10: TESTING, DEVOPS, SCALABILITY & BEHAVIORAL DEFENSE (Q91 – Q100)

### Q91: What Automated Unit & Integration Tests did you write?
**Answer**: 23 automated tests using JUnit 5, Mockito, and Spring Boot Test:
- `AuthServiceTest`: Validates BCrypt hash comparison, JWT generation, and invalid credential rejections.
- `ItemServiceTest`: Tests IDOR protection—ensuring non-owners receive `AccessDeniedException` on edit/delete.
- `RentalServiceTest`: Tests weekly discount calculations, platform fees, and overlapping date collision rejections.
- `PaymentServiceTest`: Tests HMAC-SHA256 signature verification and idempotent webhook processing.

### Q92: Explain your GitHub Actions CI pipeline (`ci.yml`).
**Answer**: On every push to `main`:
1. **Backend Job**: Spins up `ubuntu-latest`, installs JDK 21 (Temurin), caches Maven dependencies, and runs `mvn clean verify`.
2. **Frontend Job**: Installs Node 22, runs `npm ci`, checks ESLint rules (`npm run lint`), and executes production build (`npm run build`).
Only when all checks pass is the build marked with a green checkmark.

### Q93: How is the application containerized with Docker?
**Answer**:
- `Dockerfile` for backend uses multi-stage builds: Stage 1 builds the JAR with Maven; Stage 2 copies the slim JAR into a lightweight `eclipse-temurin:21-jre-alpine` runtime running as an unprivileged non-root user.
- `docker-compose.yml` orchestrates 3 containers: `campusshare-db` (PostgreSQL), `campusshare-backend` (Spring Boot), and `campusshare-frontend` (Nginx serving React SPA).

### Q94: If CampusShare scales to 50,000 students, what bottlenecks will emerge and how will you solve them?
**Answer**:
1. **Database Read Pressure**: Implement **Redis** to cache frequently queried marketplace items (`GET /api/items`) and user profile badges with 5-minute TTL.
2. **Database Connection Pool**: Tune HikariCP pool sizes and deploy PostgreSQL Read Replicas for read-heavy marketplace traffic.
3. **Webhook & Email Queues**: Move webhook processing and email notifications to an asynchronous message broker (**Apache Kafka** or **RabbitMQ**).
4. **Media Storage**: Offload image uploads to **AWS S3 / Cloudflare R2** with CDN distribution.

### Q95: What was the most challenging bug or technical hurdle you faced, and how did you resolve it?
**Answer**: The biggest challenge was handling concurrent booking requests for the same item during exam periods. If two students submitted bookings for the same calculator simultaneously, standard queries resulted in race conditions. I resolved this by introducing **Pessimistic Database Write Locks (`@Lock(LockModeType.PESSIMISTIC_WRITE)`)** at the JPA repository level, forcing concurrent requests to queue sequentially at the database row level, combined with strict interval intersection validation before committing.

### Q96: How did you ensure sensitive API keys (Razorpay, JWT secrets) are not leaked?
**Answer**: Secrets are externalized using Spring environment variables (`${JWT_SECRET}`, `${RAZORPAY_KEY_SECRET}`) and `.env` files. `.gitignore` strictly excludes `.env`, `application-local.yml`, and build artifacts from Git history.

### Q97: What is the difference between Unit Testing and Integration Testing in your project?
**Answer**:
- **Unit Tests**: Test individual service classes in isolation using Mockito mocks without spinning up database or Spring context (executes in milliseconds).
- **Integration Tests**: Test end-to-end flows using `@SpringBootTest` with in-memory H2 database to verify database constraints, transactions, and security filters.

### Q98: If you had 2 more weeks to work on this project, what features would you build next?
**Answer**:
1. **WebSocket Real-Time Chat**: Upgrade REST polling chat to bidirectional WebSockets (STOMP / SockJS) for instant messaging and typing indicators.
2. **Push Notifications**: Integrate Web Push API / Firebase Cloud Messaging (FCM) for mobile lock-screen alerts when handover PINs are ready.
3. **Automated AI Damage Detection**: Use computer vision to compare pre-rental and post-return photos for automated dispute analysis.

### Q99: Why should a recruiter hire you based on this project?
**Answer**: CampusShare demonstrates full-stack software engineering maturity beyond standard CRUD tutorials. It showcases:
- **Security-first mindset**: BCrypt hashing, JWT rotation with HttpOnly cookies, IDOR protection.
- **Financial & Data Integrity**: Pessimistic concurrency locks, idempotent webhook reconciliation, server-side authoritative pricing.
- **Production Readiness**: Docker containerization, Flyway migrations, GitHub Actions CI, and clean test coverage.
- **Domain empathy**: Tailored specifically for the campus ecosystem with real-world safety mechanisms like Handover PINs and campus landmark meeting spots.

### Q100: Summarize CampusShare in three words.
**Answer**: **Secure, Authoritative, Campus-Exclusive.**

