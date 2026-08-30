package com.campusshare.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rental_transactions", indexes = {
        @Index(name = "idx_rental_item_dates", columnList = "item_id,start_date,end_date"),
        @Index(name = "idx_rental_borrower", columnList = "borrower_id"),
        @Index(name = "idx_rental_owner", columnList = "owner_id"),
        @Index(name = "idx_rental_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RentalTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "borrower_id", nullable = false)
    private User borrower;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    @Min(1)
    private Integer durationDays;

    @NotNull
    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal itemAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal platformFee;

    @Column(precision = 10, scale = 2)
    private BigDecimal depositAmount;

    @Column(length = 200)
    private String itemTitleSnapshot;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceAtTransaction;

    @Column(length = 500)
    private String requestMessage;

    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TransactionType transactionType = TransactionType.RENTAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.NOT_SPECIFIED;

    @Column(length = 100)
    private String razorpayOrderId;

    @Column(length = 100)
    private String razorpayPaymentId;

    private LocalDateTime paymentVerifiedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean depositRefunded = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    @Builder.Default
    private DepositRefundStatus depositRefundStatus = DepositRefundStatus.NOT_REQUESTED;

    @Column(precision = 10, scale = 2)
    private BigDecimal depositDeductionAmount;

    @Column(length = 500)
    private String depositDeductionReason;

    @Column(length = 100)
    private String razorpayRefundId;

    private LocalDateTime depositRefundedAt;

    @JsonIgnore
    @Column(length = 6)
    private String handoverPin;

    private LocalDateTime acceptedAt;
    private LocalDateTime declinedAt;

    @Column(length = 500)
    private String declineReason;

    // Meeting Arrangement
    @Column(length = 120)
    private String meetingLocation;

    private LocalDate meetingDate;

    @Column(length = 30)
    private String meetingTime;

    @Column(length = 500)
    private String meetingNotes;

    private Long meetingProposedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MeetingStatus meetingStatus = MeetingStatus.NONE;

    // Voluntary Contact Sharing
    @Column(nullable = false)
    @Builder.Default
    private Boolean borrowerSharedContact = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ownerSharedContact = false;

    // Double Confirmation: Handover
    @Column(nullable = false)
    @Builder.Default
    private Boolean borrowerConfirmedHandover = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ownerConfirmedHandover = false;

    private LocalDateTime itemCollectedAt;

    // Double Confirmation: Return (for rentals)
    @Column(nullable = false)
    @Builder.Default
    private Boolean borrowerConfirmedReturn = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ownerConfirmedReturn = false;

    private LocalDateTime itemReturnedAt;

    // Dispute metadata
    @Column(length = 500)
    private String disputeReason;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<ChatMessage> chatMessages = new ArrayList<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum TransactionType {
        RENTAL,
        PURCHASE
    }

    public enum TransactionStatus {
        PENDING,
        ACCEPTED,
        DECLINED,
        ACTIVE,
        COMPLETED,
        CANCELLED,
        DISPUTED
    }

    public enum PaymentStatus {
        PENDING,
        BUYER_MARKED_PAID,
        PAID,
        FAILED,
        REFUNDED,
        DISPUTED
    }

    public enum PaymentMethod {
        NOT_SPECIFIED,
        UPI,
        CASH,
        ONLINE_RAZORPAY
    }

    public enum MeetingStatus {
        NONE,
        PROPOSED,
        CONFIRMED
    }

    public enum DepositRefundStatus {
        NOT_REQUESTED,
        PROCESSING,
        REFUNDED,
        FAILED
    }
}
