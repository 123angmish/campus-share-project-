package com.campusshare.controller;

import com.campusshare.dto.AdminReportActionRequest;
import com.campusshare.dto.AdminUserResponse;
import com.campusshare.dto.ReportResponse;
import com.campusshare.dto.ReviewResponse;
import com.campusshare.model.Item;
import com.campusshare.model.PaymentWebhookEvent;
import com.campusshare.model.RentalTransaction;
import com.campusshare.model.Report;
import com.campusshare.model.User;
import com.campusshare.repository.ItemRepository;
import com.campusshare.repository.PaymentWebhookEventRepository;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.ReportRepository;
import com.campusshare.repository.ReviewRepository;
import com.campusshare.repository.UserRepository;
import com.campusshare.security.UserPrincipal;
import com.campusshare.service.ReportService;
import com.campusshare.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    private final UserRepository users;
    private final ItemRepository items;
    private final ReportRepository reports;
    private final ReviewRepository reviews;
    private final RentalTransactionRepository rentals;
    private final PaymentWebhookEventRepository webhookEvents;
    private final ReportService reportService;
    private final ReviewService reviewService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        Map<String, Object> d = new LinkedHashMap<>();
        long totalUsers = users.count();
        long verifiedUsers = users.countByEmailVerifiedTrueAndActiveTrue();
        long totalTransactions = rentals.count();
        long completed = rentals.countByStatus(RentalTransaction.TransactionStatus.COMPLETED);
        long active = rentals.countByStatus(RentalTransaction.TransactionStatus.ACTIVE);
        long paid = rentals.countByPaymentStatus(RentalTransaction.PaymentStatus.PAID);
        Double gmv = rentals.getCapturedRentalGmv();

        BigDecimal platformFeeEarnings = rentals.findAll().stream()
                .filter(t -> t.getStatus() == RentalTransaction.TransactionStatus.COMPLETED || t.getPaymentStatus() == RentalTransaction.PaymentStatus.PAID)
                .map(t -> t.getPlatformFee() != null ? t.getPlatformFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalBoosts = items.findAll().stream()
                .mapToLong(i -> i.getBoostCount() != null ? i.getBoostCount() : 0)
                .sum();
        BigDecimal boostEarnings = BigDecimal.valueOf(totalBoosts * 29L);

        long proUsersCount = users.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsProMember()))
                .count();
        BigDecimal proEarnings = BigDecimal.valueOf(proUsersCount * 49L);

        BigDecimal totalPlatformRevenue = platformFeeEarnings.add(boostEarnings).add(proEarnings);

        d.put("totalUsers", totalUsers);
        d.put("verifiedUsers", verifiedUsers);
        d.put("proUsersCount", proUsersCount);
        d.put("totalItems", items.count());
        d.put("totalTransactions", totalTransactions);
        d.put("activeRentals", active);
        d.put("completedRentals", completed);
        d.put("capturedPayments", paid);
        d.put("capturedRentalGmv", gmv == null ? 0.0 : gmv);
        d.put("platformFeeEarnings", platformFeeEarnings);
        d.put("boostEarnings", boostEarnings);
        d.put("proEarnings", proEarnings);
        d.put("totalPlatformRevenue", totalPlatformRevenue);
        d.put("platformEarnings", totalPlatformRevenue);
        d.put("completionRate", totalTransactions == 0 ? 0.0 : Math.round((completed * 1000.0 / totalTransactions)) / 10.0);
        d.put("verificationRate", totalUsers == 0 ? 0.0 : Math.round((verifiedUsers * 1000.0 / totalUsers)) / 10.0);
        d.put("pendingReports", reports.findPendingReports().size());
        d.put("openReports", reports.countByStatusIn(List.of(Report.ReportStatus.PENDING, Report.ReportStatus.INVESTIGATING)));
        d.put("flaggedItems", items.findFlaggedItems().size());
        d.put("flaggedReviews", reviews.findFlaggedReviews().size());
        long webhookFailed = webhookEvents.countByStatus(PaymentWebhookEvent.ProcessingStatus.FAILED);
        long webhookQueued = webhookEvents.countByStatus(PaymentWebhookEvent.ProcessingStatus.RECEIVED)
                + webhookEvents.countByStatus(PaymentWebhookEvent.ProcessingStatus.PROCESSING);
        d.put("webhookBacklog", webhookQueued + webhookFailed);
        d.put("webhookFailures", webhookFailed);
        return ResponseEntity.ok(d);
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> allUsers() {
        return ResponseEntity.ok(users.findAll().stream().map(AdminUserResponse::from).toList());
    }

    @GetMapping("/reports")
    public ResponseEntity<List<ReportResponse>> allReports(@RequestParam(required = false) Report.ReportStatus status) {
        return ResponseEntity.ok(reportService.list(status));
    }

    @GetMapping("/reports/pending")
    public ResponseEntity<List<ReportResponse>> pendingReports() {
        return ResponseEntity.ok(reportService.list(Report.ReportStatus.PENDING));
    }

    @PatchMapping("/reports/{id}")
    public ResponseEntity<ReportResponse> moderateReport(@PathVariable Long id,
                                                          @Valid @RequestBody AdminReportActionRequest request,
                                                          @AuthenticationPrincipal UserPrincipal currentAdmin) {
        return ResponseEntity.ok(reportService.moderate(id, request, currentAdmin.getId()));
    }

    @GetMapping("/items/flagged")
    public ResponseEntity<List<com.campusshare.dto.ItemResponse>> flaggedItems() {
        return ResponseEntity.ok(items.findFlaggedItems().stream().map(com.campusshare.dto.ItemResponse::fromItem).toList());
    }

    @PostMapping("/items/{id}/flag")
    public ResponseEntity<com.campusshare.dto.ItemResponse> flagItem(@PathVariable Long id, @RequestParam String reason) {
        Item item = items.findById(id).orElseThrow(() -> new RuntimeException("Item not found"));
        item.setFlagged(true);
        String cleanReason = reason == null || reason.isBlank() ? "Flagged by admin" : reason.trim();
        item.setFlagReason(cleanReason.length() > 500 ? cleanReason.substring(0, 500) : cleanReason);
        return ResponseEntity.ok(com.campusshare.dto.ItemResponse.fromItem(items.save(item)));
    }

    @PostMapping("/items/{id}/unflag")
    public ResponseEntity<com.campusshare.dto.ItemResponse> unflagItem(@PathVariable Long id) {
        Item item = items.findById(id).orElseThrow(() -> new RuntimeException("Item not found"));
        item.setFlagged(false);
        item.setFlagReason(null);
        return ResponseEntity.ok(com.campusshare.dto.ItemResponse.fromItem(items.save(item)));
    }

    @PostMapping("/users/{id}/deactivate")
    public ResponseEntity<AdminUserResponse> deactivateUser(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal currentAdmin) {
        User user = users.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (id.equals(currentAdmin.getId())) throw new RuntimeException("You cannot deactivate your own admin account");
        if (user.getRole() == User.Role.ADMIN) throw new RuntimeException("Admin accounts cannot be deactivated from this moderation endpoint");
        user.setActive(false);
        user.setRefreshTokenHash(null);
        user.setRefreshTokenExpiry(null);
        items.findByOwnerId(user.getId()).forEach(item -> {
            item.setFlagged(true);
            item.setFlagReason("Owner account suspended by moderation");
            items.save(item);
        });
        return ResponseEntity.ok(AdminUserResponse.from(users.save(user)));
    }

    @PostMapping("/users/{id}/activate")
    public ResponseEntity<AdminUserResponse> activateUser(@PathVariable Long id) {
        User user = users.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(true);
        items.findByOwnerId(user.getId()).forEach(item -> {
            if (Boolean.TRUE.equals(item.getFlagged()) && "Owner account suspended by moderation".equals(item.getFlagReason())) {
                item.setFlagged(false);
                item.setFlagReason(null);
                items.save(item);
            }
        });
        return ResponseEntity.ok(AdminUserResponse.from(users.save(user)));
    }

    @GetMapping("/reviews/flagged")
    public ResponseEntity<List<ReviewResponse>> flaggedReviews() {
        return ResponseEntity.ok(reviews.findFlaggedReviews().stream().map(ReviewResponse::from).toList());
    }

    @PostMapping("/reviews/{id}/unflag")
    public ResponseEntity<ReviewResponse> unflagReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.unflagReviewAsAdmin(id));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReviewAsAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
