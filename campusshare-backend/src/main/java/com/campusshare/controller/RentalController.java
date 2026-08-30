package com.campusshare.controller;

import com.campusshare.dto.*;
import com.campusshare.model.RentalStatusHistory;
import com.campusshare.model.RentalTransaction;
import com.campusshare.repository.ReviewRepository;
import com.campusshare.security.UserPrincipal;
import com.campusshare.service.RentalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
public class RentalController {
    private final RentalService rentalService;
    private final ReviewRepository reviews;

    @PostMapping("/request")
    public ResponseEntity<RentalResponse> createRental(@Valid @RequestBody RentalRequest request, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.createRentalRequest(request, user.getId()), user.getId()));
    }

    @PostMapping("/purchase-request")
    public ResponseEntity<RentalResponse> createPurchase(@Valid @RequestBody PurchaseRequest request, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.createPurchaseRequest(request, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/buy")
    public ResponseEntity<RentalResponse> buy(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.buyItem(id, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<RentalResponse> accept(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.acceptRentalRequest(id, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<RentalResponse> decline(@PathVariable Long id, @RequestParam(required = false, defaultValue = "") String reason, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.declineRentalRequest(id, reason, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<RentalResponse> cancel(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.cancelRental(id, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/propose-meeting")
    public ResponseEntity<RentalResponse> proposeMeeting(@PathVariable Long id, @Valid @RequestBody MeetingProposalRequest request, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.proposeMeeting(id, user.getId(), request), user.getId()));
    }

    @PostMapping("/{id}/confirm-meeting")
    public ResponseEntity<RentalResponse> confirmMeeting(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.confirmMeeting(id, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/share-contact")
    public ResponseEntity<RentalResponse> shareContact(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.shareContact(id, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<RentalResponse> markPaid(@PathVariable Long id, @Valid @RequestBody PaymentMarkRequest request, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.buyerMarkPaid(id, user.getId(), request), user.getId()));
    }

    @PostMapping("/{id}/confirm-payment")
    public ResponseEntity<RentalResponse> confirmPayment(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.sellerConfirmPayment(id, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/confirm-handover")
    public ResponseEntity<RentalResponse> confirmHandover(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.confirmItemHandover(id, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/confirm-collection")
    public ResponseEntity<RentalResponse> confirmCollection(@PathVariable Long id, @RequestBody(required = false) HandoverPinRequest request, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.confirmItemHandover(id, user.getId()), user.getId()));
    }

    @PostMapping("/{id}/confirm-return")
    public ResponseEntity<RentalResponse> confirmReturn(@PathVariable Long id, @RequestBody(required = false) ReturnConfirmationRequest request, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.confirmItemReturn(id, user.getId(), request), user.getId()));
    }

    @PostMapping("/{id}/dispute")
    public ResponseEntity<RentalResponse> reportDispute(@PathVariable Long id, @Valid @RequestBody DisputeRequest request, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.reportDispute(id, user.getId(), request), user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentalResponse> getTransaction(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(response(rentalService.getTransaction(id, user.getId()), user.getId()));
    }

    @GetMapping("/{id}/handover-pin")
    public ResponseEntity<Map<String, String>> handoverPin(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(Map.of("pin", rentalService.getHandoverPin(id, user.getId())));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<RentalStatusHistory>> getHistory(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(rentalService.getStatusHistory(id, user.getId()));
    }

    @GetMapping("/my-rentals")
    public ResponseEntity<List<RentalResponse>> myRentals(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(rentalService.getMyRentals(user.getId()).stream().map(r -> response(r, user.getId())).toList());
    }

    @GetMapping("/my-purchases")
    public ResponseEntity<List<RentalResponse>> myPurchases(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(rentalService.getMyPurchases(user.getId()).stream().map(r -> response(r, user.getId())).toList());
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<RentalResponse>> myListings(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(rentalService.getMyListings(user.getId()).stream().map(r -> response(r, user.getId())).toList());
    }

    @GetMapping("/my-sales")
    public ResponseEntity<List<RentalResponse>> mySales(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(rentalService.getMySales(user.getId()).stream().map(r -> response(r, user.getId())).toList());
    }

    @GetMapping("/pending-requests")
    public ResponseEntity<List<RentalResponse>> pending(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(rentalService.getPendingRequests(user.getId()).stream().map(r -> response(r, user.getId())).toList());
    }

    @GetMapping("/sent-requests")
    public ResponseEntity<List<RentalResponse>> sentRequests(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(rentalService.getSentRequests(user.getId()).stream().map(r -> response(r, user.getId())).toList());
    }

    @GetMapping("/all-activity")
    public ResponseEntity<List<RentalResponse>> allActivity(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(rentalService.getAllUserTransactions(user.getId()).stream().map(r -> response(r, user.getId())).toList());
    }

    private RentalResponse response(RentalTransaction rental, Long userId) {
        boolean reviewed = rental.getStatus() == RentalTransaction.TransactionStatus.COMPLETED
                && reviews.existsByTransactionIdAndReviewerId(rental.getId(), userId);
        return RentalResponse.from(rental, userId, reviewed);
    }
}
