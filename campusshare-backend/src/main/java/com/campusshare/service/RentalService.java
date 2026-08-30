package com.campusshare.service;

import com.campusshare.dto.*;
import com.campusshare.model.Item;
import com.campusshare.model.RentalStatusHistory;
import com.campusshare.model.RentalTransaction;
import com.campusshare.model.Report;
import com.campusshare.model.User;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.RentalStatusHistoryRepository;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.ReportRepository;
import com.campusshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RentalService {
    private final RentalTransactionRepository transactionRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final RentalStatusHistoryRepository statusHistoryRepository;
    private final ReportRepository reportRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public RentalTransaction createRentalRequest(RentalRequest request, Long borrowerId) {
        User borrower = userRepository.findById(borrowerId).orElseThrow(() -> new RuntimeException("Borrower not found"));
        if (!Boolean.TRUE.equals(borrower.getActive())) {
            throw new RuntimeException("Account is not active");
        }
        Item item = itemRepository.findById(request.getItemId()).orElseThrow(() -> new RuntimeException("Item not found"));
        if (item.getAvailabilityStatus() == Item.AvailabilityStatus.INACTIVE || Boolean.TRUE.equals(item.getFlagged())) {
            throw new RuntimeException("Item is not accepting rental requests");
        }
        if (item.getListingType() == Item.ListingType.BUY) {
            throw new RuntimeException("This item is available for sale only");
        }
        if (item.getOwner().getId().equals(borrowerId)) {
            throw new RuntimeException("You cannot rent your own item. Log in as a different student to test renting.");
        }
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Rental start date cannot be in the past");
        }

        long rawDays = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        long days = request.getStartDate().isEqual(request.getEndDate()) ? 1 : rawDays;
        if (days < 1) {
            throw new RuntimeException("Rental end date cannot be before start date");
        }
        if (item.getMinRentalDays() != null && days < item.getMinRentalDays()) {
            throw new RuntimeException("Minimum rental duration for this item is " + item.getMinRentalDays() + " days");
        }
        if (item.getMaxRentalDays() != null && days > item.getMaxRentalDays()) {
            throw new RuntimeException("Maximum rental duration for this item is " + item.getMaxRentalDays() + " days");
        }
        if (days > 90) {
            throw new RuntimeException("A rental can be at most 90 days");
        }

        if (item.getAvailStartDate() != null && request.getStartDate().isBefore(item.getAvailStartDate())) {
            throw new RuntimeException("Item is available only from " + item.getAvailStartDate());
        }
        if (item.getAvailEndDate() != null && request.getEndDate().isAfter(item.getAvailEndDate())) {
            throw new RuntimeException("Item is available only until " + item.getAvailEndDate());
        }

        if (transactionRepository.existsConflictingBooking(item.getId(), request.getStartDate(), request.getEndDate())) {
            throw new RuntimeException("These dates overlap with an existing booking. Please choose different dates");
        }

        BigDecimal itemRentAmount = calculateRent(item, days);
        BigDecimal platformFee = calculatePlatformFee(itemRentAmount, borrower);
        BigDecimal deposit = item.getDepositAmount() != null ? item.getDepositAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = itemRentAmount.add(platformFee);

        String pickup = (request.getPickupLocation() != null && !request.getPickupLocation().isBlank())
                ? request.getPickupLocation().trim()
                : (item.getPickupLocation() != null ? item.getPickupLocation() : "Campus CampusShare Spot");
        String meetTime = (request.getMeetingTime() != null && !request.getMeetingTime().isBlank())
                ? request.getMeetingTime().trim()
                : "Flexible / Chat in app";

        RentalTransaction transaction = RentalTransaction.builder()
                .item(item)
                .itemTitleSnapshot(item.getTitle())
                .priceAtTransaction(item.getDailyPrice())
                .borrower(borrower)
                .owner(item.getOwner())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .durationDays((int) days)
                .itemAmount(itemRentAmount)
                .platformFee(platformFee)
                .totalAmount(totalAmount)
                .depositAmount(deposit)
                .requestMessage(request.getMessage() != null ? request.getMessage().trim() : null)
                .transactionType(RentalTransaction.TransactionType.RENTAL)
                .status(RentalTransaction.TransactionStatus.PENDING)
                .paymentStatus(RentalTransaction.PaymentStatus.PENDING)
                .paymentMethod(RentalTransaction.PaymentMethod.NOT_SPECIFIED)
                .depositRefundStatus(RentalTransaction.DepositRefundStatus.NOT_REQUESTED)
                .meetingLocation(pickup)
                .meetingDate(request.getStartDate())
                .meetingTime(meetTime)
                .meetingStatus(RentalTransaction.MeetingStatus.PROPOSED)
                .meetingProposedBy(borrowerId)
                .borrowerSharedContact(true)
                .build();
        transaction = transactionRepository.save(transaction);

        recordHistory(transaction, null, "REQUESTED", borrower, "Rental request created for " + days + " days (Fee: ₹" + platformFee + ")");
        notificationService.createNotification(
                item.getOwner(),
                "New Rental Request: " + item.getTitle(),
                borrower.getName() + " requested to rent \"" + item.getTitle() + "\" from " + request.getStartDate() + " to " + request.getEndDate() + " (Total: ₹" + totalAmount + ").",
                "RENTAL_REQUESTED",
                "/history"
        );

        emailService.sendRentalRequestNotification(item.getOwner().getEmail(), item.getTitle(), borrower.getName());
        return transaction;
    }

    @Transactional
    public RentalTransaction createPurchaseRequest(PurchaseRequest request, Long buyerId) {
        User buyer = userRepository.findById(buyerId).orElseThrow(() -> new RuntimeException("Buyer not found"));
        if (!Boolean.TRUE.equals(buyer.getActive())) {
            throw new RuntimeException("Account is not active");
        }
        Item item = itemRepository.findById(request.getItemId()).orElseThrow(() -> new RuntimeException("Item not found"));
        if (item.getAvailabilityStatus() != Item.AvailabilityStatus.AVAILABLE || Boolean.TRUE.equals(item.getFlagged())) {
            throw new RuntimeException("Item is not available for purchase");
        }
        if (item.getOwner().getId().equals(buyerId)) {
            throw new RuntimeException("You cannot buy your own item. Log in as a different student to test purchasing.");
        }
        if (item.getListingType() == Item.ListingType.RENT && item.getBuyPrice() == null) {
            throw new RuntimeException("This item is only available for rent");
        }

        BigDecimal purchasePrice = item.getBuyPrice() != null ? item.getBuyPrice() : item.getDailyPrice();
        if (purchasePrice == null || purchasePrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid purchase price");
        }

        BigDecimal platformFee = calculatePlatformFee(purchasePrice, buyer);
        BigDecimal totalAmount = purchasePrice.add(platformFee);

        String pickup = (request.getPickupLocation() != null && !request.getPickupLocation().isBlank())
                ? request.getPickupLocation().trim()
                : (item.getPickupLocation() != null ? item.getPickupLocation() : "Campus CampusShare Spot");
        String meetTime = (request.getMeetingTime() != null && !request.getMeetingTime().isBlank())
                ? request.getMeetingTime().trim()
                : "Flexible / Chat in app";

        RentalTransaction transaction = RentalTransaction.builder()
                .item(item)
                .itemTitleSnapshot(item.getTitle())
                .priceAtTransaction(purchasePrice)
                .borrower(buyer)
                .owner(item.getOwner())
                .startDate(LocalDate.now())
                .endDate(LocalDate.now())
                .durationDays(1)
                .itemAmount(purchasePrice)
                .platformFee(platformFee)
                .totalAmount(totalAmount)
                .depositAmount(BigDecimal.ZERO)
                .requestMessage(request.getMessage() != null ? request.getMessage().trim() : null)
                .transactionType(RentalTransaction.TransactionType.PURCHASE)
                .status(RentalTransaction.TransactionStatus.PENDING)
                .paymentStatus(RentalTransaction.PaymentStatus.PENDING)
                .paymentMethod(RentalTransaction.PaymentMethod.NOT_SPECIFIED)
                .depositRefundStatus(RentalTransaction.DepositRefundStatus.NOT_REQUESTED)
                .meetingLocation(pickup)
                .meetingDate(LocalDate.now())
                .meetingTime(meetTime)
                .meetingStatus(RentalTransaction.MeetingStatus.PROPOSED)
                .meetingProposedBy(buyerId)
                .borrowerSharedContact(true)
                .build();
        transaction = transactionRepository.save(transaction);

        recordHistory(transaction, null, "BUY_REQUESTED", buyer, "Purchase request created for ₹" + purchasePrice + " (Fee: ₹" + platformFee + ")");
        notificationService.createNotification(
                item.getOwner(),
                "New Purchase Request: " + item.getTitle(),
                buyer.getName() + " wants to buy \"" + item.getTitle() + "\" for ₹" + purchasePrice + " (Total: ₹" + totalAmount + ").",
                "PURCHASE_REQUESTED",
                "/history"
        );

        return transaction;
    }

    @Transactional
    public RentalTransaction acceptRentalRequest(Long transactionId, Long ownerId) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Only the owner can accept this request");
        }
        if (transaction.getStatus() != RentalTransaction.TransactionStatus.PENDING) {
            throw new RuntimeException("Request is no longer pending");
        }

        itemRepository.findByIdForUpdate(transaction.getItem().getId()).orElseThrow(() -> new RuntimeException("Item not found"));
        if (transaction.getTransactionType() == RentalTransaction.TransactionType.RENTAL &&
                transactionRepository.existsConflictingBooking(transaction.getItem().getId(), transaction.getStartDate(), transaction.getEndDate())) {
            throw new RuntimeException("Another accepted booking overlaps these dates");
        }

        transaction.setStatus(RentalTransaction.TransactionStatus.ACCEPTED);
        transaction.setAcceptedAt(LocalDateTime.now());
        transaction.setHandoverPin(String.format("%06d", secureRandom.nextInt(1_000_000)));
        transaction.setMeetingStatus(RentalTransaction.MeetingStatus.CONFIRMED);
        transaction.setOwnerSharedContact(true);
        transaction = transactionRepository.save(transaction);

        recordHistory(transaction, "PENDING", "ACCEPTED", transaction.getOwner(), "Accepted by owner. Handover meeting confirmed.");
        notificationService.createNotification(
                transaction.getBorrower(),
                "Request Accepted!",
                transaction.getOwner().getName() + " accepted your request for \"" + transaction.getItem().getTitle() + "\". You can now chat in-app and complete the handover.",
                "REQUEST_ACCEPTED",
                "/history"
        );

        return transaction;
    }

    @Transactional
    public RentalTransaction declineRentalRequest(Long transactionId, String reason, Long ownerId) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Only the owner can decline this request");
        }
        if (transaction.getStatus() != RentalTransaction.TransactionStatus.PENDING) {
            throw new RuntimeException("Request is no longer pending");
        }
        transaction.setStatus(RentalTransaction.TransactionStatus.DECLINED);
        transaction.setDeclinedAt(LocalDateTime.now());
        transaction.setDeclineReason(reason == null ? null : reason.trim());
        transaction = transactionRepository.save(transaction);

        recordHistory(transaction, "PENDING", "DECLINED", transaction.getOwner(), "Declined: " + (reason != null ? reason : "No reason provided"));
        notificationService.createNotification(
                transaction.getBorrower(),
                "Request Declined",
                "Your request for \"" + transaction.getItem().getTitle() + "\" was declined" + (reason != null ? ": " + reason : "."),
                "REQUEST_DECLINED",
                "/history"
        );

        return transaction;
    }

    @Transactional
    public RentalTransaction cancelRental(Long transactionId, Long userId) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        boolean borrower = transaction.getBorrower().getId().equals(userId);
        boolean owner = transaction.getOwner().getId().equals(userId);
        if (!borrower && !owner) {
            throw new RuntimeException("You are not part of this transaction");
        }
        if (transaction.getStatus() == RentalTransaction.TransactionStatus.ACTIVE ||
                transaction.getStatus() == RentalTransaction.TransactionStatus.COMPLETED) {
            throw new RuntimeException("Active or completed transactions cannot be cancelled");
        }

        String oldStatus = transaction.getStatus().name();
        transaction.setStatus(RentalTransaction.TransactionStatus.CANCELLED);
        transaction.setDeclinedAt(LocalDateTime.now());
        transaction.setDeclineReason(borrower ? "Cancelled by requester" : "Cancelled by owner");
        transaction = transactionRepository.save(transaction);

        User actingUser = borrower ? transaction.getBorrower() : transaction.getOwner();
        User otherUser = borrower ? transaction.getOwner() : transaction.getBorrower();
        recordHistory(transaction, oldStatus, "CANCELLED", actingUser, borrower ? "Cancelled by requester" : "Cancelled by owner");
        notificationService.createNotification(
                otherUser,
                "Transaction Cancelled",
                "The transaction for \"" + transaction.getItem().getTitle() + "\" was cancelled by " + actingUser.getName() + ".",
                "TRANSACTION_CANCELLED",
                "/history"
        );

        return transaction;
    }

    // Meeting Arrangement
    @Transactional
    public RentalTransaction proposeMeeting(Long transactionId, Long userId, MeetingProposalRequest request) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        boolean isBorrower = transaction.getBorrower().getId().equals(userId);
        boolean isOwner = transaction.getOwner().getId().equals(userId);
        if (!isBorrower && !isOwner) {
            throw new RuntimeException("You are not part of this transaction");
        }
        if (transaction.getStatus() != RentalTransaction.TransactionStatus.ACCEPTED &&
                transaction.getStatus() != RentalTransaction.TransactionStatus.ACTIVE) {
            throw new RuntimeException("Meetings can only be scheduled for accepted transactions");
        }

        transaction.setMeetingLocation(request.getLocation().trim());
        transaction.setMeetingDate(request.getDate());
        transaction.setMeetingTime(request.getTime().trim());
        transaction.setMeetingNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        transaction.setMeetingProposedBy(userId);
        transaction.setMeetingStatus(RentalTransaction.MeetingStatus.PROPOSED);
        transaction = transactionRepository.save(transaction);

        User actingUser = isBorrower ? transaction.getBorrower() : transaction.getOwner();
        User otherUser = isBorrower ? transaction.getOwner() : transaction.getBorrower();

        notificationService.createNotification(
                otherUser,
                "Meeting Proposed: " + request.getLocation(),
                actingUser.getName() + " proposed meeting at " + request.getLocation() + " on " + request.getDate() + " at " + request.getTime() + ".",
                "MEETING_PROPOSED",
                "/history"
        );

        return transaction;
    }

    @Transactional
    public RentalTransaction confirmMeeting(Long transactionId, Long userId) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        boolean isBorrower = transaction.getBorrower().getId().equals(userId);
        boolean isOwner = transaction.getOwner().getId().equals(userId);
        if (!isBorrower && !isOwner) {
            throw new RuntimeException("You are not part of this transaction");
        }
        if (transaction.getMeetingStatus() != RentalTransaction.MeetingStatus.PROPOSED) {
            throw new RuntimeException("No meeting proposal is pending confirmation");
        }
        if (userId.equals(transaction.getMeetingProposedBy())) {
            throw new RuntimeException("The other party must confirm the meeting proposal");
        }

        transaction.setMeetingStatus(RentalTransaction.MeetingStatus.CONFIRMED);
        transaction = transactionRepository.save(transaction);

        User actingUser = isBorrower ? transaction.getBorrower() : transaction.getOwner();
        User otherUser = isBorrower ? transaction.getOwner() : transaction.getBorrower();

        notificationService.createNotification(
                otherUser,
                "Meeting Confirmed!",
                actingUser.getName() + " confirmed the meeting at " + transaction.getMeetingLocation() + " (" + transaction.getMeetingDate() + " at " + transaction.getMeetingTime() + ").",
                "MEETING_CONFIRMED",
                "/history"
        );

        return transaction;
    }

    // Voluntary Contact Sharing
    @Transactional
    public RentalTransaction shareContact(Long transactionId, Long userId) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        boolean isBorrower = transaction.getBorrower().getId().equals(userId);
        boolean isOwner = transaction.getOwner().getId().equals(userId);
        if (!isBorrower && !isOwner) {
            throw new RuntimeException("You are not part of this transaction");
        }

        if (isBorrower) {
            transaction.setBorrowerSharedContact(true);
            notificationService.createNotification(
                    transaction.getOwner(),
                    "Contact Shared",
                    transaction.getBorrower().getName() + " shared their contact number (" + transaction.getBorrower().getContactNumber() + ").",
                    "CONTACT_SHARED",
                    "/history"
            );
        } else {
            transaction.setOwnerSharedContact(true);
            notificationService.createNotification(
                    transaction.getBorrower(),
                    "Contact Shared",
                    transaction.getOwner().getName() + " shared their contact number (" + transaction.getOwner().getContactNumber() + ").",
                    "CONTACT_SHARED",
                    "/history"
            );
        }

        return transactionRepository.save(transaction);
    }

    // Peer-to-Peer Payment Confirmation
    @Transactional
    public RentalTransaction buyerMarkPaid(Long transactionId, Long buyerId, PaymentMarkRequest request) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getBorrower().getId().equals(buyerId)) {
            throw new RuntimeException("Only the buyer/borrower can mark payment as sent");
        }
        if (transaction.getStatus() != RentalTransaction.TransactionStatus.ACCEPTED) {
            throw new RuntimeException("Payment can only be recorded for accepted requests");
        }

        RentalTransaction.PaymentMethod method;
        try {
            method = RentalTransaction.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
        } catch (Exception e) {
            method = RentalTransaction.PaymentMethod.UPI;
        }

        transaction.setPaymentMethod(method);
        transaction.setPaymentStatus(RentalTransaction.PaymentStatus.BUYER_MARKED_PAID);
        transaction = transactionRepository.save(transaction);

        recordHistory(transaction, "PENDING", "BUYER_MARKED_PAID", transaction.getBorrower(), "Buyer marked payment made via " + method);
        notificationService.createNotification(
                transaction.getOwner(),
                "Payment Marked by Buyer",
                transaction.getBorrower().getName() + " marked payment of ₹" + transaction.getTotalAmount() + " via " + method + ". Please verify and confirm receipt.",
                "PAYMENT_MARKED",
                "/history"
        );

        return transaction;
    }

    @Transactional
    public RentalTransaction sellerConfirmPayment(Long transactionId, Long ownerId) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Only the seller/owner can confirm receipt of payment");
        }

        transaction.setPaymentStatus(RentalTransaction.PaymentStatus.PAID);
        transaction.setPaymentVerifiedAt(LocalDateTime.now());
        transaction = transactionRepository.save(transaction);

        recordHistory(transaction, "BUYER_MARKED_PAID", "PAID", transaction.getOwner(), "Seller confirmed receipt of payment");
        notificationService.createNotification(
                transaction.getBorrower(),
                "Payment Confirmed!",
                transaction.getOwner().getName() + " confirmed receipt of ₹" + transaction.getTotalAmount() + ". You can now proceed to physical item handover.",
                "PAYMENT_CONFIRMED",
                "/history"
        );

        return transaction;
    }

    // Double Confirmation: Handover
    @Transactional
    public RentalTransaction confirmItemHandover(Long transactionId, Long userId) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        boolean isBorrower = transaction.getBorrower().getId().equals(userId);
        boolean isOwner = transaction.getOwner().getId().equals(userId);
        if (!isBorrower && !isOwner) {
            throw new RuntimeException("You are not part of this transaction");
        }
        if (transaction.getStatus() != RentalTransaction.TransactionStatus.ACCEPTED) {
            throw new RuntimeException("Handover can only be confirmed for accepted requests");
        }

        if (isBorrower) {
            transaction.setBorrowerConfirmedHandover(true);
            notificationService.createNotification(
                    transaction.getOwner(),
                    "Handover Acknowledged",
                    transaction.getBorrower().getName() + " marked that they received the item.",
                    "HANDOVER_CONFIRMED",
                    "/history"
            );
        } else {
            transaction.setOwnerConfirmedHandover(true);
            notificationService.createNotification(
                    transaction.getBorrower(),
                    "Item Handed Over",
                    transaction.getOwner().getName() + " marked that they handed over the item.",
                    "HANDOVER_CONFIRMED",
                    "/history"
            );
        }

        // Check if both confirmed handover
        if (Boolean.TRUE.equals(transaction.getBorrowerConfirmedHandover()) &&
                Boolean.TRUE.equals(transaction.getOwnerConfirmedHandover())) {
            transaction.setItemCollectedAt(LocalDateTime.now());

            if (transaction.getTransactionType() == RentalTransaction.TransactionType.PURCHASE) {
                transaction.setStatus(RentalTransaction.TransactionStatus.COMPLETED);
                transaction.setPaymentStatus(RentalTransaction.PaymentStatus.PAID);
                transaction.setBorrowerConfirmedReturn(true);
                transaction.setOwnerConfirmedReturn(true);
                transaction.setItemReturnedAt(LocalDateTime.now());
                transaction.setCompletedAt(LocalDateTime.now());

                Item item = itemRepository.findByIdForUpdate(transaction.getItem().getId())
                        .orElseThrow(() -> new RuntimeException("Item not found"));
                item.setAvailabilityStatus(Item.AvailabilityStatus.SOLD);
                itemRepository.save(item);

                recordHistory(transaction, "ACCEPTED", "COMPLETED", transaction.getOwner(), "Purchase handover completed. Item marked SOLD.");
                notificationService.createNotification(
                        transaction.getBorrower(),
                        "Purchase Completed!",
                        "Both parties confirmed handover. \"" + item.getTitle() + "\" is now owned by you!",
                        "PURCHASE_COMPLETED",
                        "/history"
                );
            } else {
                // Rental flow
                transaction.setStatus(RentalTransaction.TransactionStatus.ACTIVE);
                Item item = itemRepository.findByIdForUpdate(transaction.getItem().getId())
                        .orElseThrow(() -> new RuntimeException("Item not found"));
                item.setAvailabilityStatus(Item.AvailabilityStatus.RENTED);
                itemRepository.save(item);

                recordHistory(transaction, "ACCEPTED", "ACTIVE", transaction.getBorrower(), "Both parties confirmed handover. Rental is now ACTIVE.");
                notificationService.createNotification(
                        transaction.getBorrower(),
                        "Rental Active!",
                        "Both parties confirmed handover. \"" + item.getTitle() + "\" is now actively rented until " + transaction.getEndDate() + ".",
                        "RENTAL_ACTIVE",
                        "/history"
                );
            }
        }

        return transactionRepository.save(transaction);
    }

    // Double Confirmation: Return
    @Transactional
    public RentalTransaction confirmItemReturn(Long transactionId, Long userId, ReturnConfirmationRequest request) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (transaction.getStatus() != RentalTransaction.TransactionStatus.ACTIVE) {
            throw new RuntimeException("Only active rentals can be marked for return");
        }

        boolean isBorrower = transaction.getBorrower().getId().equals(userId);
        boolean isOwner = transaction.getOwner().getId().equals(userId);
        if (!isBorrower && !isOwner) {
            throw new RuntimeException("You are not part of this transaction");
        }

        if (isBorrower) {
            transaction.setBorrowerConfirmedReturn(true);
            notificationService.createNotification(
                    transaction.getOwner(),
                    "Item Return Initiated",
                    transaction.getBorrower().getName() + " marked \"" + transaction.getItem().getTitle() + "\" as returned. Please confirm receipt and deposit.",
                    "RETURN_REQUESTED",
                    "/history"
            );
        } else {
            transaction.setOwnerConfirmedReturn(true);
            if (request != null && request.getDepositDeductionAmount() != null && request.getDepositDeductionAmount().compareTo(BigDecimal.ZERO) > 0) {
                transaction.setDepositDeductionAmount(request.getDepositDeductionAmount());
                transaction.setDepositDeductionReason(request.getDepositDeductionReason() != null ? request.getDepositDeductionReason().trim() : "Deduction by owner");
            }
            transaction.setDepositRefunded(true);
            transaction.setDepositRefundStatus(RentalTransaction.DepositRefundStatus.REFUNDED);
            transaction.setDepositRefundedAt(LocalDateTime.now());
            notificationService.createNotification(
                    transaction.getBorrower(),
                    "Return Receipt Acknowledged",
                    transaction.getOwner().getName() + " confirmed receipt of \"" + transaction.getItem().getTitle() + "\".",
                    "RETURN_CONFIRMED",
                    "/history"
            );
        }

        if (Boolean.TRUE.equals(transaction.getBorrowerConfirmedReturn()) &&
                Boolean.TRUE.equals(transaction.getOwnerConfirmedReturn())) {
            transaction.setStatus(RentalTransaction.TransactionStatus.COMPLETED);
            transaction.setItemReturnedAt(LocalDateTime.now());
            transaction.setCompletedAt(LocalDateTime.now());

            Item item = itemRepository.findByIdForUpdate(transaction.getItem().getId())
                    .orElseThrow(() -> new RuntimeException("Item not found"));
            item.setAvailabilityStatus(Item.AvailabilityStatus.AVAILABLE);
            itemRepository.save(item);

            recordHistory(transaction, "ACTIVE", "COMPLETED", transaction.getOwner(), "Both parties confirmed return. Rental completed.");
            notificationService.createNotification(
                    transaction.getBorrower(),
                    "Rental Completed!",
                    "Rental of \"" + item.getTitle() + "\" is successfully completed. Please leave a review for " + transaction.getOwner().getName() + "!",
                    "RENTAL_COMPLETED",
                    "/history"
            );
        }

        return transactionRepository.save(transaction);
    }

    // Dispute / Report Issue
    @Transactional
    public RentalTransaction reportDispute(Long transactionId, Long userId, DisputeRequest request) {
        RentalTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        boolean isBorrower = transaction.getBorrower().getId().equals(userId);
        boolean isOwner = transaction.getOwner().getId().equals(userId);
        if (!isBorrower && !isOwner) {
            throw new RuntimeException("You are not part of this transaction");
        }

        transaction.setStatus(RentalTransaction.TransactionStatus.DISPUTED);
        transaction.setDisputeReason(request.getReason() + ": " + request.getDescription());
        transaction = transactionRepository.save(transaction);

        User reporter = isBorrower ? transaction.getBorrower() : transaction.getOwner();
        User reported = isBorrower ? transaction.getOwner() : transaction.getBorrower();

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reported)
                .reportedItem(transaction.getItem())
                .reportType(Report.ReportType.USER)
                .reason(request.getReason() + " - " + request.getDescription())
                .status(Report.ReportStatus.PENDING)
                .build();
        reportRepository.save(report);

        recordHistory(transaction, "ACTIVE", "DISPUTED", reporter, "Dispute reported: " + request.getReason());
        notificationService.createNotification(
                reported,
                "Issue Reported on Transaction",
                reporter.getName() + " submitted an issue regarding \"" + transaction.getItem().getTitle() + "\": " + request.getReason(),
                "DISPUTE_OPENED",
                "/history"
        );

        return transaction;
    }

    // Direct Buy (Instant complete fallback)
    @Transactional
    public RentalTransaction buyItem(Long itemId, Long buyerId) {
        PurchaseRequest req = new PurchaseRequest();
        req.setItemId(itemId);
        req.setMessage("Direct buy");
        RentalTransaction tx = createPurchaseRequest(req, buyerId);
        acceptRentalRequest(tx.getId(), tx.getOwner().getId());
        confirmItemHandover(tx.getId(), buyerId);
        confirmItemHandover(tx.getId(), tx.getOwner().getId());
        return tx;
    }

    @Transactional(readOnly = true)
    public RentalTransaction getTransaction(Long transactionId, Long userId) {
        RentalTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getBorrower().getId().equals(userId) && !transaction.getOwner().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to view this transaction");
        }
        return transaction;
    }

    @Transactional(readOnly = true)
    public List<RentalStatusHistory> getStatusHistory(Long transactionId, Long userId) {
        RentalTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getBorrower().getId().equals(userId) && !transaction.getOwner().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to view this transaction's history");
        }
        return statusHistoryRepository.findByRentalIdOrderByCreatedAtAsc(transactionId);
    }

    @Transactional(readOnly = true)
    public List<RentalTransaction> getMyRentals(Long userId) {
        return transactionRepository.findByBorrowerIdOrderByCreatedAtDesc(userId).stream()
                .filter(t -> t.getTransactionType() == RentalTransaction.TransactionType.RENTAL)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RentalTransaction> getMyPurchases(Long userId) {
        return transactionRepository.findByBorrowerIdOrderByCreatedAtDesc(userId).stream()
                .filter(t -> t.getTransactionType() == RentalTransaction.TransactionType.PURCHASE)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RentalTransaction> getMyListings(Long userId) {
        return transactionRepository.findByOwnerIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<RentalTransaction> getMySales(Long userId) {
        return transactionRepository.findByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .filter(t -> t.getTransactionType() == RentalTransaction.TransactionType.PURCHASE)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RentalTransaction> getPendingRequests(Long ownerId) {
        return transactionRepository.findPendingRequestsForOwner(ownerId);
    }

    @Transactional(readOnly = true)
    public List<RentalTransaction> getSentRequests(Long borrowerId) {
        return transactionRepository.findByBorrowerIdOrderByCreatedAtDesc(borrowerId).stream()
                .filter(t -> t.getStatus() == RentalTransaction.TransactionStatus.PENDING)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RentalTransaction> getAllUserTransactions(Long userId) {
        return transactionRepository.findByBorrowerIdOrOwnerId(userId);
    }

    @Transactional(readOnly = true)
    public String getHandoverPin(Long transactionId, Long ownerId) {
        RentalTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Only the owner can view the handover PIN");
        }
        return transaction.getHandoverPin();
    }

    public void recordHistory(RentalTransaction rental, String fromStatus, String toStatus, User changedBy, String note) {
        try {
            RentalStatusHistory history = RentalStatusHistory.builder()
                    .rental(rental)
                    .fromStatus(fromStatus)
                    .toStatus(toStatus)
                    .changedBy(changedBy)
                    .note(note)
                    .build();
            statusHistoryRepository.save(history);
        } catch (Exception ignored) {}
    }

    private BigDecimal calculateRent(Item item, long days) {
        if (item.getWeeklyPrice() != null && days >= 7) {
            long weeks = days / 7, remaining = days % 7;
            return item.getWeeklyPrice().multiply(BigDecimal.valueOf(weeks)).add(item.getDailyPrice().multiply(BigDecimal.valueOf(remaining)));
        }
        return item.getDailyPrice().multiply(BigDecimal.valueOf(days));
    }

    public BigDecimal calculatePlatformFee(BigDecimal amount, User user) {
        if (user != null && Boolean.TRUE.equals(user.getIsProMember()) &&
                (user.getProExpiresAt() == null || user.getProExpiresAt().isAfter(LocalDateTime.now()))) {
            return BigDecimal.ZERO;
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        BigDecimal fee = amount.multiply(new BigDecimal("0.05")).setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal minFee = new BigDecimal("10");
        BigDecimal maxFee = new BigDecimal("150");
        return fee.max(minFee).min(maxFee);
    }

    public BigDecimal calculatePlatformFee(BigDecimal amount) {
        return calculatePlatformFee(amount, null);
    }
}
