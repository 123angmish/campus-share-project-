package com.campusshare.repository;

import com.campusshare.model.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {
    boolean existsByEventId(String eventId);
    Optional<PaymentWebhookEvent> findByEventId(String eventId);
    long countByStatus(PaymentWebhookEvent.ProcessingStatus status);

    List<PaymentWebhookEvent> findTop50ByStatusInAndAttemptCountLessThanOrderByReceivedAtAsc(
            Collection<PaymentWebhookEvent.ProcessingStatus> statuses,
            Integer maxAttempts
    );

    List<PaymentWebhookEvent> findTop50ByStatusAndProcessingStartedAtBeforeAndAttemptCountLessThanOrderByReceivedAtAsc(
            PaymentWebhookEvent.ProcessingStatus status,
            LocalDateTime processingStartedAt,
            Integer maxAttempts
    );
}
