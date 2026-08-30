package com.campusshare.dto;

import com.campusshare.model.RentalTransaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalResponse {
    private Long id;
    private ItemResponse item;
    private PublicUserResponse borrower;
    private PublicUserResponse owner;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationDays;
    private BigDecimal totalAmount;
    private BigDecimal itemAmount;
    private BigDecimal platformFee;
    private BigDecimal depositAmount;
    private String itemTitleSnapshot;
    private BigDecimal priceAtTransaction;
    private String requestMessage;
    private String transactionType;
    private String status;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String paymentStatus;
    private String paymentMethod;

    // Meeting Details
    private String meetingLocation;
    private LocalDate meetingDate;
    private String meetingTime;
    private String meetingNotes;
    private Long meetingProposedBy;
    private String meetingStatus;

    // Contact Sharing
    private Boolean borrowerSharedContact;
    private Boolean ownerSharedContact;
    private String borrowerContactPhone;
    private String borrowerContactEmail;
    private String ownerContactPhone;
    private String ownerContactEmail;

    // Double Confirmation: Handover
    private Boolean borrowerConfirmedHandover;
    private Boolean ownerConfirmedHandover;
    private LocalDateTime itemCollectedAt;

    // Double Confirmation: Return
    private Boolean borrowerConfirmedReturn;
    private Boolean ownerConfirmedReturn;
    private LocalDateTime itemReturnedAt;
    private BigDecimal depositDeductionAmount;
    private String depositDeductionReason;

    private Boolean depositRefunded;
    private String depositRefundStatus;
    private LocalDateTime acceptedAt;
    private LocalDateTime declinedAt;
    private String declineReason;
    private String disputeReason;
    private LocalDateTime createdAt;
    private Boolean reviewedByCurrentUser;
    private Boolean isBorrower;
    private Boolean isOwner;

    public static RentalResponse from(RentalTransaction rental, Long currentUserId, boolean reviewedByCurrentUser) {
        boolean isBorrower = currentUserId != null && rental.getBorrower().getId().equals(currentUserId);
        boolean isOwner = currentUserId != null && rental.getOwner().getId().equals(currentUserId);

        RentalResponseBuilder builder = RentalResponse.builder()
                .id(rental.getId())
                .item(ItemResponse.fromItem(rental.getItem()))
                .borrower(PublicUserResponse.fromUser(rental.getBorrower()))
                .owner(PublicUserResponse.fromUser(rental.getOwner()))
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .durationDays(rental.getDurationDays())
                .totalAmount(rental.getTotalAmount())
                .itemAmount(rental.getItemAmount() != null ? rental.getItemAmount() : rental.getTotalAmount())
                .platformFee(rental.getPlatformFee() != null ? rental.getPlatformFee() : BigDecimal.ZERO)
                .depositAmount(rental.getDepositAmount())
                .itemTitleSnapshot(rental.getItemTitleSnapshot() != null ? rental.getItemTitleSnapshot() : (rental.getItem() != null ? rental.getItem().getTitle() : null))
                .priceAtTransaction(rental.getPriceAtTransaction())
                .completedAt(rental.getCompletedAt())
                .cancelledAt(rental.getCancelledAt())
                .requestMessage(rental.getRequestMessage())
                .transactionType(rental.getTransactionType() != null ? rental.getTransactionType().name() : RentalTransaction.TransactionType.RENTAL.name())
                .status(rental.getStatus().name())
                .paymentStatus(rental.getPaymentStatus().name())
                .paymentMethod(rental.getPaymentMethod() != null ? rental.getPaymentMethod().name() : RentalTransaction.PaymentMethod.NOT_SPECIFIED.name())
                .meetingLocation(rental.getMeetingLocation())
                .meetingDate(rental.getMeetingDate())
                .meetingTime(rental.getMeetingTime())
                .meetingNotes(rental.getMeetingNotes())
                .meetingProposedBy(rental.getMeetingProposedBy())
                .meetingStatus(rental.getMeetingStatus() != null ? rental.getMeetingStatus().name() : RentalTransaction.MeetingStatus.NONE.name())
                .borrowerSharedContact(rental.getBorrowerSharedContact())
                .ownerSharedContact(rental.getOwnerSharedContact())
                .borrowerConfirmedHandover(rental.getBorrowerConfirmedHandover())
                .ownerConfirmedHandover(rental.getOwnerConfirmedHandover())
                .itemCollectedAt(rental.getItemCollectedAt())
                .borrowerConfirmedReturn(rental.getBorrowerConfirmedReturn())
                .ownerConfirmedReturn(rental.getOwnerConfirmedReturn())
                .itemReturnedAt(rental.getItemReturnedAt())
                .depositDeductionAmount(rental.getDepositDeductionAmount())
                .depositDeductionReason(rental.getDepositDeductionReason())
                .depositRefunded(rental.getDepositRefunded())
                .depositRefundStatus(rental.getDepositRefundStatus() != null ? rental.getDepositRefundStatus().name() : RentalTransaction.DepositRefundStatus.NOT_REQUESTED.name())
                .acceptedAt(rental.getAcceptedAt())
                .declinedAt(rental.getDeclinedAt())
                .declineReason(rental.getDeclineReason())
                .disputeReason(rental.getDisputeReason())
                .createdAt(rental.getCreatedAt())
                .reviewedByCurrentUser(reviewedByCurrentUser)
                .isBorrower(isBorrower)
                .isOwner(isOwner);

        // Disclose contacts only if voluntary consent given
        if (Boolean.TRUE.equals(rental.getBorrowerSharedContact())) {
            builder.borrowerContactPhone(rental.getBorrower().getContactNumber());
            builder.borrowerContactEmail(rental.getBorrower().getEmail());
        }
        if (Boolean.TRUE.equals(rental.getOwnerSharedContact())) {
            builder.ownerContactPhone(rental.getOwner().getContactNumber());
            builder.ownerContactEmail(rental.getOwner().getEmail());
        }

        return builder.build();
    }
}
