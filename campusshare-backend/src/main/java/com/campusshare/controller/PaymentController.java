package com.campusshare.controller;

import com.campusshare.dto.DepositRefundResponse;
import com.campusshare.dto.PaymentOrderResponse;
import com.campusshare.dto.PaymentVerifyRequest;
import com.campusshare.dto.RentalResponse;
import com.campusshare.security.UserPrincipal;
import com.campusshare.service.PaymentService;
import com.campusshare.service.PaymentWebhookInboxService;
import com.campusshare.service.PaymentWebhookProcessor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService payments;
    private final PaymentWebhookInboxService webhookInbox;
    private final PaymentWebhookProcessor webhookProcessor;

    @PostMapping("/rentals/{id}/order")
    public ResponseEntity<PaymentOrderResponse> order(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(payments.createOrder(id, user.getId()));
    }

    @PostMapping("/rentals/{id}/verify")
    public ResponseEntity<RentalResponse> verify(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user,
                                                  @Valid @RequestBody PaymentVerifyRequest request) {
        return ResponseEntity.ok(RentalResponse.from(payments.verify(id, user.getId(), request), user.getId(), false));
    }

    @PostMapping("/rentals/{id}/refund-deposit")
    public ResponseEntity<DepositRefundResponse> refund(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(payments.refundDeposit(id, user.getId()));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String body,
                                        @RequestHeader("X-Razorpay-Signature") String signature,
                                        @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId) {
        // Signature verification + durable inbox write happen before we acknowledge.
        // Reconciliation runs outside this request so Razorpay receives a fast 2xx response.
        Long storedEventId = webhookInbox.accept(body, signature, eventId);
        webhookProcessor.processAsync(storedEventId);
        return ResponseEntity.ok().build();
    }
}
