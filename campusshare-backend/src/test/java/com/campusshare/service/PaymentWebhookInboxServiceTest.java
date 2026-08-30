package com.campusshare.service;

import com.campusshare.model.PaymentWebhookEvent;
import com.campusshare.repository.PaymentWebhookEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookInboxServiceTest {
    @Mock PaymentWebhookEventRepository events;
    PaymentWebhookInboxService service;

    @BeforeEach
    void setUp() {
        service = new PaymentWebhookInboxService(events, new ObjectMapper());
        ReflectionTestUtils.setField(service, "webhookSecret", "webhook_secret_123");
    }

    @Test
    void verifiesRawSignatureAndStoresDurableInboxEvent() throws Exception {
        String body = "{\"event\":\"payment.captured\",\"payload\":{}}";
        String signature = hmac(body, "webhook_secret_123");
        when(events.findByEventId("evt_1")).thenReturn(Optional.empty());
        when(events.saveAndFlush(any(PaymentWebhookEvent.class))).thenAnswer(inv -> {
            PaymentWebhookEvent event = inv.getArgument(0);
            event.setId(42L);
            return event;
        });

        Long id = service.accept(body, signature, "evt_1");

        assertEquals(42L, id);
        verify(events).saveAndFlush(argThat(event ->
                event.getEventType().equals("payment.captured") &&
                event.getRawPayload().equals(body) &&
                event.getStatus() == PaymentWebhookEvent.ProcessingStatus.RECEIVED));
    }

    @Test
    void duplicateEventIsIdempotent() throws Exception {
        String body = "{\"event\":\"payment.captured\"}";
        String signature = hmac(body, "webhook_secret_123");
        PaymentWebhookEvent existing = PaymentWebhookEvent.builder().id(9L).eventId("evt_same")
                .eventType("payment.captured").rawPayload(body).receivedAt(java.time.LocalDateTime.now()).build();
        when(events.findByEventId("evt_same")).thenReturn(Optional.of(existing));

        assertEquals(9L, service.accept(body, signature, "evt_same"));
        verify(events, never()).saveAndFlush(any());
    }

    @Test
    void rejectsInvalidSignatureBeforePersistence() {
        String body = "{\"event\":\"payment.captured\"}";
        RuntimeException error = assertThrows(RuntimeException.class,
                () -> service.accept(body, "forged", "evt_bad"));
        assertTrue(error.getMessage().contains("signature"));
        verifyNoInteractions(events);
    }

    private static String hmac(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }
}
