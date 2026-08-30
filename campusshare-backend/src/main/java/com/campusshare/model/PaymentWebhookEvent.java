package com.campusshare.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_webhook_events", indexes = {
        @Index(name = "idx_webhook_status_received", columnList = "status,received_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentWebhookEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 160)
    private String eventId;

    @Column(nullable = false, length = 80)
    private String eventType;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String rawPayload;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private ProcessingStatus status = ProcessingStatus.RECEIVED;

    @Column(nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(length = 1200)
    private String lastError;

    @Column(nullable = false)
    private LocalDateTime receivedAt;

    private LocalDateTime processingStartedAt;
    private LocalDateTime processedAt;

    public enum ProcessingStatus {
        RECEIVED,
        PROCESSING,
        PROCESSED,
        FAILED
    }
}
