package com.campusshare.controller;

import com.campusshare.dto.ReviewRequest;
import com.campusshare.dto.ReviewResponse;
import com.campusshare.security.UserPrincipal;
import com.campusshare.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody ReviewRequest request,
                                                        @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reviewService.createReview(request, currentUser.getId()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewResponse>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getUserReviews(userId));
    }

    @GetMapping("/transactions/{transactionId}/status")
    public ResponseEntity<Map<String, Boolean>> reviewStatus(@PathVariable Long transactionId,
                                                              @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(Map.of("reviewed", reviewService.hasReviewed(transactionId, currentUser.getId())));
    }

    @PostMapping("/{id}/flag")
    public ResponseEntity<Void> flagReview(@PathVariable Long id, @RequestParam String reason,
                                            @AuthenticationPrincipal UserPrincipal currentUser) {
        reviewService.flagReview(id, reason, currentUser.getId());
        return ResponseEntity.ok().build();
    }
}
