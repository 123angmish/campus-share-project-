package com.campusshare.service;

import com.campusshare.dto.DepositRefundResponse;
import com.campusshare.dto.PaymentOrderResponse;
import com.campusshare.dto.PaymentVerifyRequest;
import com.campusshare.model.PaymentAttempt;
import com.campusshare.model.RentalTransaction;
import com.campusshare.model.User;
import com.campusshare.repository.PaymentAttemptRepository;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final RentalTransactionRepository rentals;
    private final UserRepository users;
    private final PaymentAttemptRepository attempts;
    private final RazorpayGateway gateway;
    private final ObjectMapper mapper;
    private final NotificationService notificationService;
    private final com.campusshare.repository.RentalStatusHistoryRepository statusHistoryRepository;

    @Transactional
    public PaymentOrderResponse createOrder(Long rentalId, Long userId) {
        RentalTransaction rental = rentals.findByIdForUpdate(rentalId).orElseThrow(() -> new RuntimeException("Rental not found"));
        if (!rental.getBorrower().getId().equals(userId)) throw new RuntimeException("Only the borrower can pay");
        if (rental.getStatus() != RentalTransaction.TransactionStatus.ACCEPTED) throw new RuntimeException("Owner must accept the request before payment");
        if (rental.getPaymentStatus() == RentalTransaction.PaymentStatus.PAID) throw new RuntimeException("This rental is already paid");

        BigDecimal amount = payableAmount(rental);
        long paise = toPaise(amount);
        User user = users.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        // Reuse the same unpaid provider order instead of creating parallel payable orders.
        // This materially reduces accidental double-payment risk when users reopen checkout.
        var openAttempt = attempts.findFirstByRental_IdAndStatusInOrderByCreatedAtDesc(
                rentalId, java.util.List.of(PaymentAttempt.Status.CREATED, PaymentAttempt.Status.AUTHORIZED));
        if (openAttempt.isPresent()) {
            PaymentAttempt attempt = openAttempt.get();
            if (attempt.getAmountPaise() != paise || !"INR".equalsIgnoreCase(attempt.getCurrency())) {
                throw new RuntimeException("Existing payment order no longer matches the rental amount");
            }
            rental.setRazorpayOrderId(attempt.getProviderOrderId());
            rental.setPaymentStatus(RentalTransaction.PaymentStatus.PENDING);
            rentals.save(rental);
            return buildOrderResponse(rental, user, attempt);
        }

        String receipt = "cs_" + rental.getId() + "_" + System.currentTimeMillis();
        RazorpayGateway.OrderResult order = gateway.createOrder(paise, "INR", receipt, Map.of(
                "rentalId", String.valueOf(rental.getId()),
                "itemId", String.valueOf(rental.getItem().getId())
        ));
        if (order.id() == null || order.id().isBlank() || order.amount() != paise || !"INR".equalsIgnoreCase(order.currency()) || !"created".equalsIgnoreCase(order.status())) {
            throw new RuntimeException("Payment provider returned an invalid order");
        }

        PaymentAttempt attempt = attempts.save(PaymentAttempt.builder()
                .rental(rental).providerOrderId(order.id()).amount(amount).amountPaise(paise)
                .currency("INR").status(PaymentAttempt.Status.CREATED).build());
        rental.setRazorpayOrderId(order.id());
        rental.setPaymentStatus(RentalTransaction.PaymentStatus.PENDING);
        rentals.save(rental);

        return buildOrderResponse(rental, user, attempt);
    }

    @Transactional
    public RentalTransaction verify(Long rentalId, Long userId, PaymentVerifyRequest request) {
        RentalTransaction rental = rentals.findByIdForUpdate(rentalId).orElseThrow(() -> new RuntimeException("Rental not found"));
        if (!rental.getBorrower().getId().equals(userId)) throw new RuntimeException("Only the borrower can verify payment");
        if (rental.getStatus() != RentalTransaction.TransactionStatus.ACCEPTED) throw new RuntimeException("Rental is not awaiting payment");

        PaymentAttempt attempt = attempts.findByProviderOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Unknown payment order"));
        if (!attempt.getRental().getId().equals(rentalId)) throw new RuntimeException("Payment order does not belong to this rental");
        if (attempt.getStatus() == PaymentAttempt.Status.CAPTURED && rental.getPaymentStatus() == RentalTransaction.PaymentStatus.PAID) {
            if (request.getRazorpayPaymentId().equals(attempt.getProviderPaymentId())) return rental;
            throw new RuntimeException("This payment order is already completed");
        }

        String secret = gateway.keySecret();
        if (secret != null && !secret.isBlank()) {
            String expected = hmac(attempt.getProviderOrderId() + "|" + request.getRazorpayPaymentId(), secret);
            if (!constantTime(expected, request.getRazorpaySignature())) {
                attempt.setStatus(PaymentAttempt.Status.FAILED);
                attempt.setFailureCode("SIGNATURE_MISMATCH");
                attempt.setFailureMessage("Checkout signature verification failed");
                attempts.save(attempt);
                throw new RuntimeException("Payment signature verification failed");
            }
        }

        RazorpayGateway.PaymentResult providerPayment = gateway.fetchPayment(request.getRazorpayPaymentId());
        validateProviderPayment(attempt, providerPayment);

        if ("authorized".equalsIgnoreCase(providerPayment.status())) {
            attempt.setStatus(PaymentAttempt.Status.AUTHORIZED);
            attempts.save(attempt);
            try {
                providerPayment = gateway.capturePayment(providerPayment.id(), attempt.getAmountPaise(), attempt.getCurrency());
            } catch (RuntimeException captureError) {
                RazorpayGateway.PaymentResult latest = gateway.fetchPayment(providerPayment.id());
                if (!"captured".equalsIgnoreCase(latest.status())) throw captureError;
                providerPayment = latest;
            }
        }

        if (!"captured".equalsIgnoreCase(providerPayment.status())) {
            throw new RuntimeException("Payment is verified but not captured yet. Please retry status shortly");
        }
        return markCaptured(rental, attempt, providerPayment.id());
    }

    @Transactional
    public DepositRefundResponse refundDeposit(Long rentalId, Long ownerId) {
        RentalTransaction rental = rentals.findByIdForUpdate(rentalId).orElseThrow(() -> new RuntimeException("Rental not found"));
        if (!rental.getOwner().getId().equals(ownerId)) throw new RuntimeException("Only the owner can release the deposit");
        if (rental.getStatus() != RentalTransaction.TransactionStatus.COMPLETED) throw new RuntimeException("Deposit can be refunded only after both sides confirm return");
        if (rental.getPaymentStatus() != RentalTransaction.PaymentStatus.PAID || rental.getRazorpayPaymentId() == null) throw new RuntimeException("No captured payment is available to refund");
        if (rental.getDepositRefundStatus() == RentalTransaction.DepositRefundStatus.REFUNDED || Boolean.TRUE.equals(rental.getDepositRefunded())) throw new RuntimeException("Deposit already refunded");
        if (rental.getDepositRefundStatus() == RentalTransaction.DepositRefundStatus.PROCESSING) throw new RuntimeException("Deposit refund is already processing");

        BigDecimal amount = rental.getDepositAmount() == null ? BigDecimal.ZERO : rental.getDepositAmount();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) throw new RuntimeException("This rental has no security deposit");

        rental.setDepositRefundStatus(RentalTransaction.DepositRefundStatus.PROCESSING);
        RazorpayGateway.RefundResult refund = gateway.refund(rental.getRazorpayPaymentId(), toPaise(amount), String.valueOf(rental.getId()));
        rental.setRazorpayRefundId(refund.id());
        if ("processed".equalsIgnoreCase(refund.status())) {
            rental.setDepositRefundStatus(RentalTransaction.DepositRefundStatus.REFUNDED);
            rental.setDepositRefunded(true);
            rental.setDepositRefundedAt(LocalDateTime.now());

            try {
                statusHistoryRepository.save(com.campusshare.model.RentalStatusHistory.builder()
                        .rental(rental)
                        .fromStatus("COMPLETED")
                        .toStatus("DEPOSIT_REFUNDED")
                        .changedBy(rental.getOwner())
                        .note("Security deposit of ₹" + amount + " refunded.")
                        .build());

                notificationService.createNotification(
                        rental.getBorrower(),
                        "Security Deposit Refunded",
                        "Your refundable deposit of ₹" + amount + " for \"" + rental.getItem().getTitle() + "\" has been refunded.",
                        "DEPOSIT_REFUNDED",
                        "/history"
                );
            } catch (Exception ignored) {}
        }
        rentals.save(rental);
        return DepositRefundResponse.builder().refundId(refund.id()).amount(amount).status(refund.status()).build();
    }

    @Transactional
    public void reconcileWebhook(String rawBody) {
        try {
            JsonNode root = mapper.readTree(rawBody);
            String event = root.path("event").asText("unknown");
            switch (event) {
                case "payment.authorized" -> handleAuthorizedWebhook(root);
                case "payment.captured" -> handleCapturedWebhook(root);
                case "payment.failed" -> handleFailedWebhook(root);
                case "refund.processed" -> handleRefundWebhook(root, true);
                case "refund.failed" -> handleRefundWebhook(root, false);
                default -> { /* valid but irrelevant events are acknowledged */ }
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Could not reconcile Razorpay webhook", e);
        }
    }


    private void handleAuthorizedWebhook(JsonNode root) {
        JsonNode payment = root.path("payload").path("payment").path("entity");
        String orderId = payment.path("order_id").asText();
        String paymentId = payment.path("id").asText();
        if (orderId.isBlank() || paymentId.isBlank()) return;

        attempts.findByProviderOrderId(orderId).ifPresent(attempt -> {
            if (payment.path("amount").asLong(-1) != attempt.getAmountPaise()) return;
            if (!attempt.getCurrency().equalsIgnoreCase(payment.path("currency").asText())) return;
            if (attempt.getStatus() == PaymentAttempt.Status.CAPTURED) return;

            RentalTransaction rental = rentals.findByIdForUpdate(attempt.getRental().getId())
                    .orElseThrow(() -> new RuntimeException("Rental not found during webhook reconciliation"));
            if (rental.getPaymentStatus() == RentalTransaction.PaymentStatus.PAID) {
                if (paymentId.equals(rental.getRazorpayPaymentId())) {
                    syncCapturedAttempt(attempt, paymentId);
                    return;
                }
                throw new RuntimeException("Rental already has a different captured payment");
            }
            attempt.setProviderPaymentId(paymentId);
            attempt.setStatus(PaymentAttempt.Status.AUTHORIZED);
            attempts.save(attempt);

            RazorpayGateway.PaymentResult captured;
            try {
                captured = gateway.capturePayment(paymentId, attempt.getAmountPaise(), attempt.getCurrency());
            } catch (RuntimeException captureError) {
                RazorpayGateway.PaymentResult latest = gateway.fetchPayment(paymentId);
                if (!"captured".equalsIgnoreCase(latest.status())) throw captureError;
                captured = latest;
            }
            validateProviderPayment(attempt, captured);
            if (!"captured".equalsIgnoreCase(captured.status())) {
                throw new RuntimeException("Authorized payment could not be captured yet");
            }
            markCaptured(rental, attempt, captured.id());
        });
    }

    private void handleCapturedWebhook(JsonNode root) {
        JsonNode payment = root.path("payload").path("payment").path("entity");
        String orderId = payment.path("order_id").asText();
        String paymentId = payment.path("id").asText();
        if (orderId.isBlank() || paymentId.isBlank()) return;
        attempts.findByProviderOrderId(orderId).ifPresent(attempt -> {
            if (payment.path("amount").asLong(-1) != attempt.getAmountPaise()) return;
            if (!attempt.getCurrency().equalsIgnoreCase(payment.path("currency").asText())) return;
            RentalTransaction rental = rentals.findByIdForUpdate(attempt.getRental().getId())
                    .orElseThrow(() -> new RuntimeException("Rental not found during webhook reconciliation"));
            markCaptured(rental, attempt, paymentId);
        });
    }

    private void handleFailedWebhook(JsonNode root) {
        JsonNode payment = root.path("payload").path("payment").path("entity");
        String orderId = payment.path("order_id").asText();
        if (orderId.isBlank()) return;
        attempts.findByProviderOrderId(orderId).ifPresent(attempt -> {
            if (attempt.getStatus() == PaymentAttempt.Status.CAPTURED) return;
            RentalTransaction rental = rentals.findByIdForUpdate(attempt.getRental().getId())
                    .orElseThrow(() -> new RuntimeException("Rental not found during webhook reconciliation"));
            // A late failure webhook must never regress a payment that another request already captured.
            if (rental.getPaymentStatus() == RentalTransaction.PaymentStatus.PAID || attempt.getStatus() == PaymentAttempt.Status.CAPTURED) return;
            attempt.setStatus(PaymentAttempt.Status.FAILED);
            attempt.setProviderPaymentId(blankToNull(payment.path("id").asText()));
            attempt.setFailureCode(blankToNull(payment.path("error_code").asText()));
            attempt.setFailureMessage(blankToNull(payment.path("error_description").asText()));
            attempts.save(attempt);
            if (rental.getPaymentStatus() != RentalTransaction.PaymentStatus.PAID) {
                rental.setPaymentStatus(RentalTransaction.PaymentStatus.FAILED);
                rentals.save(rental);
            }
        });
    }

    private void handleRefundWebhook(JsonNode root, boolean processed) {
        JsonNode refund = root.path("payload").path("refund").path("entity");
        String refundId = refund.path("id").asText();
        if (refundId.isBlank()) return;
        rentals.findByRazorpayRefundId(refundId).ifPresent(rental -> {
            if (processed) {
                rental.setDepositRefundStatus(RentalTransaction.DepositRefundStatus.REFUNDED);
                rental.setDepositRefunded(true);
                rental.setDepositRefundedAt(LocalDateTime.now());
            } else {
                rental.setDepositRefundStatus(RentalTransaction.DepositRefundStatus.FAILED);
                rental.setDepositRefunded(false);
            }
            rentals.save(rental);
        });
    }

    private RentalTransaction markCaptured(RentalTransaction rental, PaymentAttempt attempt, String paymentId) {
        if (rental.getPaymentStatus() == RentalTransaction.PaymentStatus.PAID) {
            if (paymentId.equals(rental.getRazorpayPaymentId())) {
                syncCapturedAttempt(attempt, paymentId);
                return rental;
            }
            throw new RuntimeException("Rental already has a different captured payment");
        }
        syncCapturedAttempt(attempt, paymentId);

        rental.setRazorpayOrderId(attempt.getProviderOrderId());
        rental.setRazorpayPaymentId(paymentId);
        rental.setPaymentVerifiedAt(LocalDateTime.now());
        rental.setPaymentStatus(RentalTransaction.PaymentStatus.PAID);
        rental = rentals.save(rental);

        try {
            statusHistoryRepository.save(com.campusshare.model.RentalStatusHistory.builder()
                    .rental(rental)
                    .fromStatus("ACCEPTED")
                    .toStatus("PAID")
                    .changedBy(rental.getBorrower())
                    .note("Payment of ₹" + rental.getTotalAmount() + " (deposit: ₹" + rental.getDepositAmount() + ") completed")
                    .build());

            notificationService.createNotification(
                    rental.getOwner(),
                    "Payment Received: " + rental.getItem().getTitle(),
                    rental.getBorrower().getName() + " completed payment of ₹" + payableAmount(rental) + ". Please reveal handover PIN during pickup.",
                    "PAYMENT_RECEIVED",
                    "/history"
            );
            notificationService.createNotification(
                    rental.getBorrower(),
                    "Payment Successful: " + rental.getItem().getTitle(),
                    "Your payment of ₹" + payableAmount(rental) + " was successful. Please meet " + rental.getOwner().getName() + " for handover.",
                    "PAYMENT_SUCCESS",
                    "/history"
            );
        } catch (Exception ignored) {}

        return rental;
    }

    private void syncCapturedAttempt(PaymentAttempt attempt, String paymentId) {
        attempt.setProviderPaymentId(paymentId);
        attempt.setStatus(PaymentAttempt.Status.CAPTURED);
        if (attempt.getVerifiedAt() == null) attempt.setVerifiedAt(LocalDateTime.now());
        attempts.save(attempt);
    }

    private void validateProviderPayment(PaymentAttempt attempt, RazorpayGateway.PaymentResult payment) {
        if (!attempt.getProviderOrderId().equals(payment.orderId())) throw new RuntimeException("Payment order mismatch");
        if (attempt.getAmountPaise() != payment.amount()) throw new RuntimeException("Payment amount mismatch");
        if (!attempt.getCurrency().equalsIgnoreCase(payment.currency())) throw new RuntimeException("Payment currency mismatch");
    }


    private PaymentOrderResponse buildOrderResponse(RentalTransaction rental, User user, PaymentAttempt attempt) {
        return PaymentOrderResponse.builder()
                .paymentAttemptId(attempt.getId())
                .orderId(attempt.getProviderOrderId())
                .keyId(gateway.keyId())
                .amountPaise(attempt.getAmountPaise())
                .amount(attempt.getAmount())
                .currency(attempt.getCurrency())
                .itemTitle(rental.getItem().getTitle())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .userPhone(user.getContactNumber())
                .build();
    }

    private BigDecimal payableAmount(RentalTransaction rental) {
        return rental.getTotalAmount().add(rental.getDepositAmount() == null ? BigDecimal.ZERO : rental.getDepositAmount());
    }
    private long toPaise(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
    private String hmac(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new IllegalStateException("Could not verify signature", e); }
    }
    private boolean constantTime(String expected, String actual) {
        if (actual == null) return false;
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value; }
}
