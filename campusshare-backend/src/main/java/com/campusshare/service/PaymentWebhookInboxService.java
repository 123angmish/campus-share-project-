package com.campusshare.service;

import com.campusshare.model.PaymentWebhookEvent;
import com.campusshare.repository.PaymentWebhookEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

/**
 * Fast webhook ingress path: authenticate the raw Razorpay request and durably persist it.
 * Business reconciliation intentionally happens outside the HTTP request thread.
 */
@Service
@RequiredArgsConstructor
public class PaymentWebhookInboxService {
    private final PaymentWebhookEventRepository events;
    private final ObjectMapper mapper;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    @Transactional
    public Long accept(String rawBody, String signature, String eventIdHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new RuntimeException("Webhook secret not configured");
        }
        if (rawBody == null || rawBody.isBlank()) {
            throw new RuntimeException("Webhook payload is empty");
        }
        if (signature == null || !constantTime(hmac(rawBody, webhookSecret), signature)) {
            throw new RuntimeException("Invalid Razorpay webhook signature");
        }

        try {
            JsonNode root = mapper.readTree(rawBody);
            String eventType = root.path("event").asText("unknown");
            String safeEventId = (eventIdHeader == null || eventIdHeader.isBlank())
                    ? "fallback-" + sha256(rawBody)
                    : eventIdHeader.trim();

            var existing = events.findByEventId(safeEventId);
            if (existing.isPresent()) return existing.get().getId();

            try {
                PaymentWebhookEvent saved = events.saveAndFlush(PaymentWebhookEvent.builder()
                        .eventId(safeEventId)
                        .eventType(eventType)
                        .rawPayload(rawBody)
                        .status(PaymentWebhookEvent.ProcessingStatus.RECEIVED)
                        .attemptCount(0)
                        .receivedAt(LocalDateTime.now())
                        .build());
                return saved.getId();
            } catch (DataIntegrityViolationException race) {
                // Two duplicate deliveries may race on different request threads. The DB unique key wins.
                return events.findByEventId(safeEventId)
                        .map(PaymentWebhookEvent::getId)
                        .orElseThrow(() -> race);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Could not persist Razorpay webhook", e);
        }
    }

    private String hmac(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Could not verify webhook signature", e);
        }
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Could not fingerprint webhook", e);
        }
    }

    private boolean constantTime(String expected, String actual) {
        if (actual == null) return false;
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }
}
