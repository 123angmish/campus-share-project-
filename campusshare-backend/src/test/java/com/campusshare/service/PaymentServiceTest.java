package com.campusshare.service;

import com.campusshare.dto.PaymentOrderResponse;
import com.campusshare.dto.PaymentVerifyRequest;
import com.campusshare.model.Item;
import com.campusshare.model.PaymentAttempt;
import com.campusshare.model.RentalTransaction;
import com.campusshare.model.User;
import com.campusshare.repository.PaymentAttemptRepository;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    @Mock RentalTransactionRepository rentals;
    @Mock UserRepository users;
    @Mock PaymentAttemptRepository attempts;
    @Mock RazorpayGateway gateway;
    @Mock NotificationService notificationService;
    @Mock com.campusshare.repository.RentalStatusHistoryRepository statusHistoryRepository;

    PaymentService service;
    User borrower;
    User owner;
    Item item;
    RentalTransaction rental;

    @BeforeEach
    void setUp() {
        service = new PaymentService(rentals, users, attempts, gateway, new ObjectMapper(), notificationService, statusHistoryRepository);
        borrower = User.builder().id(1L).name("Borrower").email("borrower@college.edu").password("hash")
                .department("ECE").year(4).contactNumber("9999999999").emailVerified(true).active(true).build();
        owner = User.builder().id(2L).name("Owner").email("owner@college.edu").password("hash")
                .department("CSE").year(4).contactNumber("8888888888").emailVerified(true).active(true).build();
        item = Item.builder().id(7L).title("Scientific Calculator").description("Casio")
                .category(Item.Category.ELECTRONICS).dailyPrice(new BigDecimal("50.00"))
                .owner(owner).availabilityStatus(Item.AvailabilityStatus.AVAILABLE).build();
        rental = RentalTransaction.builder().id(10L).item(item).borrower(borrower).owner(owner)
                .totalAmount(new BigDecimal("200.00")).depositAmount(new BigDecimal("100.00"))
                .status(RentalTransaction.TransactionStatus.ACCEPTED)
                .paymentStatus(RentalTransaction.PaymentStatus.PENDING).build();
    }

    @Test
    void createsProviderOrderForExactRentPlusDeposit() {
        when(rentals.findByIdForUpdate(10L)).thenReturn(Optional.of(rental));
        when(users.findById(1L)).thenReturn(Optional.of(borrower));
        when(attempts.findFirstByRental_IdAndStatusInOrderByCreatedAtDesc(eq(10L), anyCollection()))
                .thenReturn(Optional.empty());
        when(gateway.createOrder(eq(30000L), eq("INR"), anyString(), anyMap()))
                .thenReturn(new RazorpayGateway.OrderResult("order_123", 30000L, "INR", "created"));
        when(gateway.keyId()).thenReturn("rzp_test_public");
        when(attempts.save(any(PaymentAttempt.class))).thenAnswer(invocation -> {
            PaymentAttempt attempt = invocation.getArgument(0);
            attempt.setId(99L);
            return attempt;
        });
        when(rentals.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentOrderResponse result = service.createOrder(10L, 1L);

        assertEquals("order_123", result.getOrderId());
        assertEquals(30000L, result.getAmountPaise());
        assertEquals(new BigDecimal("300.00"), result.getAmount());
        assertEquals(99L, result.getPaymentAttemptId());
        assertEquals("order_123", rental.getRazorpayOrderId());
    }

    @Test
    void reusesExistingOpenOrderToReduceDoublePaymentRisk() {
        PaymentAttempt open = PaymentAttempt.builder().id(55L).rental(rental).providerOrderId("order_open")
                .amount(new BigDecimal("300.00")).amountPaise(30000L).currency("INR")
                .status(PaymentAttempt.Status.CREATED).build();
        when(rentals.findByIdForUpdate(10L)).thenReturn(Optional.of(rental));
        when(users.findById(1L)).thenReturn(Optional.of(borrower));
        when(attempts.findFirstByRental_IdAndStatusInOrderByCreatedAtDesc(eq(10L), anyCollection()))
                .thenReturn(Optional.of(open));
        when(gateway.keyId()).thenReturn("rzp_test_public");
        when(rentals.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentOrderResponse result = service.createOrder(10L, 1L);

        assertEquals("order_open", result.getOrderId());
        verify(gateway, never()).createOrder(anyLong(), anyString(), anyString(), anyMap());
    }

    @Test
    void marksPaidOnlyAfterProviderReportsCaptured() throws Exception {
        PaymentAttempt attempt = PaymentAttempt.builder().id(99L).rental(rental).providerOrderId("order_123")
                .amount(new BigDecimal("300.00")).amountPaise(30000L).currency("INR")
                .status(PaymentAttempt.Status.CREATED).build();
        String secret = "test_secret_value";
        String paymentId = "pay_123";
        PaymentVerifyRequest request = new PaymentVerifyRequest();
        request.setRazorpayOrderId("order_123");
        request.setRazorpayPaymentId(paymentId);
        request.setRazorpaySignature(hmac("order_123|" + paymentId, secret));

        when(rentals.findByIdForUpdate(10L)).thenReturn(Optional.of(rental));
        when(attempts.findByProviderOrderId("order_123")).thenReturn(Optional.of(attempt));
        when(gateway.keySecret()).thenReturn(secret);
        when(gateway.fetchPayment(paymentId))
                .thenReturn(new RazorpayGateway.PaymentResult(paymentId, "order_123", 30000L, "INR", "captured"));
        when(attempts.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(rentals.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        RentalTransaction result = service.verify(10L, 1L, request);

        assertEquals(RentalTransaction.PaymentStatus.PAID, result.getPaymentStatus());
        assertEquals(paymentId, result.getRazorpayPaymentId());
        assertEquals(PaymentAttempt.Status.CAPTURED, attempt.getStatus());
    }

    @Test
    void rejectsCapturedPaymentWithWrongAmount() throws Exception {
        PaymentAttempt attempt = PaymentAttempt.builder().id(99L).rental(rental).providerOrderId("order_123")
                .amount(new BigDecimal("300.00")).amountPaise(30000L).currency("INR")
                .status(PaymentAttempt.Status.CREATED).build();
        String secret = "test_secret_value";
        PaymentVerifyRequest request = new PaymentVerifyRequest();
        request.setRazorpayOrderId("order_123");
        request.setRazorpayPaymentId("pay_wrong");
        request.setRazorpaySignature(hmac("order_123|pay_wrong", secret));

        when(rentals.findByIdForUpdate(10L)).thenReturn(Optional.of(rental));
        when(attempts.findByProviderOrderId("order_123")).thenReturn(Optional.of(attempt));
        when(gateway.keySecret()).thenReturn(secret);
        when(gateway.fetchPayment("pay_wrong"))
                .thenReturn(new RazorpayGateway.PaymentResult("pay_wrong", "order_123", 1L, "INR", "captured"));

        RuntimeException error = assertThrows(RuntimeException.class, () -> service.verify(10L, 1L, request));
        assertTrue(error.getMessage().contains("amount mismatch"));
        assertNotEquals(RentalTransaction.PaymentStatus.PAID, rental.getPaymentStatus());
    }

    private static String hmac(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }
}
