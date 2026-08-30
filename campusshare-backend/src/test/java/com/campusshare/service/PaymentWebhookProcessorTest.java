package com.campusshare.service;

import com.campusshare.model.PaymentWebhookEvent;
import com.campusshare.repository.PaymentWebhookEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookProcessorTest {
    @Mock PaymentWebhookEventRepository events;
    @Mock PaymentService payments;
    PaymentWebhookProcessor processor;

    @BeforeEach
    void setUp() {
        processor = new PaymentWebhookProcessor(events, payments);
        ReflectionTestUtils.setField(processor, "maxAttempts", 5);
    }

    @Test
    void successfulReconciliationMarksInboxProcessed() {
        PaymentWebhookEvent event = event(7L);
        when(events.findById(7L)).thenReturn(Optional.of(event));
        when(events.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        processor.processOne(7L);

        verify(payments).reconcileWebhook(event.getRawPayload());
        assertEquals(PaymentWebhookEvent.ProcessingStatus.PROCESSED, event.getStatus());
        assertEquals(1, event.getAttemptCount());
        assertNotNull(event.getProcessedAt());
    }

    @Test
    void transientFailureStaysDurableForScheduledRetry() {
        PaymentWebhookEvent event = event(9L);
        when(events.findById(9L)).thenReturn(Optional.of(event));
        when(events.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new RuntimeException("temporary provider failure"))
                .when(payments).reconcileWebhook(event.getRawPayload());

        processor.processOne(9L);

        assertEquals(PaymentWebhookEvent.ProcessingStatus.FAILED, event.getStatus());
        assertEquals(1, event.getAttemptCount());
        assertEquals("temporary provider failure", event.getLastError());
    }

    private PaymentWebhookEvent event(Long id) {
        return PaymentWebhookEvent.builder()
                .id(id)
                .eventId("evt_" + id)
                .eventType("payment.captured")
                .rawPayload("{\"event\":\"payment.captured\"}")
                .status(PaymentWebhookEvent.ProcessingStatus.RECEIVED)
                .attemptCount(0)
                .receivedAt(LocalDateTime.now())
                .build();
    }
}
