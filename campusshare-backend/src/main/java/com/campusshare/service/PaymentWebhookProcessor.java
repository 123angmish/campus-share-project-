package com.campusshare.service;

import com.campusshare.model.PaymentWebhookEvent;
import com.campusshare.repository.PaymentWebhookEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Durable inbox worker. Payment reconciliation is idempotent, so a failed event can be retried safely.
 */
@Service
@RequiredArgsConstructor
public class PaymentWebhookProcessor {
    private final PaymentWebhookEventRepository events;
    private final PaymentService payments;

    @Value("${razorpay.webhook-max-attempts:5}")
    private int maxAttempts;

    @Async
    public void processAsync(Long eventDbId) {
        processOne(eventDbId);
    }

    @Scheduled(fixedDelayString = "${razorpay.webhook-recovery-ms:30000}")
    public void recoverUnprocessedEvents() {
        Map<Long, PaymentWebhookEvent> recoverable = new LinkedHashMap<>();
        events.findTop50ByStatusInAndAttemptCountLessThanOrderByReceivedAtAsc(
                List.of(PaymentWebhookEvent.ProcessingStatus.RECEIVED, PaymentWebhookEvent.ProcessingStatus.FAILED),
                maxAttempts
        ).forEach(event -> recoverable.put(event.getId(), event));

        // If the JVM dies after marking an event PROCESSING, recover the abandoned lease.
        events.findTop50ByStatusAndProcessingStartedAtBeforeAndAttemptCountLessThanOrderByReceivedAtAsc(
                PaymentWebhookEvent.ProcessingStatus.PROCESSING,
                LocalDateTime.now().minusMinutes(2),
                maxAttempts
        ).forEach(event -> recoverable.put(event.getId(), event));

        recoverable.keySet().forEach(this::processOne);
    }

    void processOne(Long eventDbId) {
        PaymentWebhookEvent event = events.findById(eventDbId).orElse(null);
        if (event == null || event.getStatus() == PaymentWebhookEvent.ProcessingStatus.PROCESSED) return;
        if (event.getAttemptCount() != null && event.getAttemptCount() >= maxAttempts) return;

        event.setStatus(PaymentWebhookEvent.ProcessingStatus.PROCESSING);
        event.setAttemptCount((event.getAttemptCount() == null ? 0 : event.getAttemptCount()) + 1);
        event.setProcessingStartedAt(LocalDateTime.now());
        event.setLastError(null);
        events.save(event);

        try {
            payments.reconcileWebhook(event.getRawPayload());
            event.setStatus(PaymentWebhookEvent.ProcessingStatus.PROCESSED);
            event.setProcessedAt(LocalDateTime.now());
            event.setLastError(null);
        } catch (Exception error) {
            event.setStatus(PaymentWebhookEvent.ProcessingStatus.FAILED);
            event.setLastError(truncate(rootMessage(error), 1200));
        }
        events.save(event);
    }

    private String rootMessage(Throwable error) {
        Throwable cursor = error;
        while (cursor.getCause() != null) cursor = cursor.getCause();
        return cursor.getMessage() == null ? cursor.getClass().getSimpleName() : cursor.getMessage();
    }

    private String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
