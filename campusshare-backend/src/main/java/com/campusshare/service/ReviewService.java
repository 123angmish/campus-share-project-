package com.campusshare.service;

import com.campusshare.dto.ReviewRequest;
import com.campusshare.dto.ReviewResponse;
import com.campusshare.model.RentalTransaction;
import com.campusshare.model.Review;
import com.campusshare.model.User;
import com.campusshare.repository.RentalTransactionRepository;
import com.campusshare.repository.ReviewRepository;
import com.campusshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final RentalTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ReviewResponse createReview(ReviewRequest request, Long reviewerId) {
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));
        RentalTransaction transaction = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (transaction.getStatus() != RentalTransaction.TransactionStatus.COMPLETED) {
            throw new RuntimeException("Can only review completed transactions");
        }
        if (reviewRepository.existsByTransactionIdAndReviewerId(transaction.getId(), reviewerId)) {
            throw new RuntimeException("You already reviewed this rental");
        }

        User reviewee;
        if (transaction.getBorrower().getId().equals(reviewerId)) reviewee = transaction.getOwner();
        else if (transaction.getOwner().getId().equals(reviewerId)) reviewee = transaction.getBorrower();
        else throw new RuntimeException("You are not part of this transaction");

        Review review = reviewRepository.save(Review.builder()
                .transaction(transaction)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(request.getComment() == null ? null : request.getComment().trim())
                .flagged(false)
                .build());

        updateUserReputation(reviewee.getId());

        try {
            notificationService.createNotification(
                    reviewee,
                    "New Review Received",
                    reviewer.getName() + " left you a " + request.getRating() + "-star review for \"" + transaction.getItem().getTitle() + "\".",
                    "NEW_REVIEW",
                    "/profile"
            );
        } catch (Exception ignored) {}

        return ReviewResponse.from(review);
    }

    @Transactional
    public void updateUserReputation(Long userId) {
        Double avgRating = reviewRepository.getAverageRatingForUser(userId);
        Long reviewCount = reviewRepository.countReviewsForUser(userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setReputationScore(avgRating != null ? avgRating : 5.0);
        user.setTotalReviews(reviewCount != null ? reviewCount.intValue() : 0);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserReviews(Long userId) {
        return reviewRepository.findByRevieweeIdAndFlaggedFalseOrderByCreatedAtDesc(userId).stream().map(ReviewResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public boolean hasReviewed(Long transactionId, Long userId) {
        return reviewRepository.existsByTransactionIdAndReviewerId(transactionId, userId);
    }

    @Transactional
    public void flagReview(Long reviewId, String reason, Long userId) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> new RuntimeException("Review not found"));
        if (review.getReviewer().getId().equals(userId)) throw new RuntimeException("You cannot flag your own review");
        if (reason == null || reason.isBlank()) throw new RuntimeException("Flag reason is required");
        String cleanReason = reason.trim();
        if (cleanReason.length() > 500) throw new RuntimeException("Flag reason cannot exceed 500 characters");
        review.setFlagged(true);
        review.setFlagReason(cleanReason);
        reviewRepository.save(review);
        updateUserReputation(review.getReviewee().getId());
    }

    @Transactional
    public ReviewResponse unflagReviewAsAdmin(Long reviewId) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> new RuntimeException("Review not found"));
        review.setFlagged(false);
        review.setFlagReason(null);
        Review saved = reviewRepository.save(review);
        updateUserReputation(saved.getReviewee().getId());
        return ReviewResponse.from(saved);
    }

    @Transactional
    public void deleteReviewAsAdmin(Long reviewId) {
        Review review = reviewRepository.findById(reviewId).orElseThrow(() -> new RuntimeException("Review not found"));
        Long revieweeId = review.getReviewee().getId();
        reviewRepository.delete(review);
        reviewRepository.flush();
        updateUserReputation(revieweeId);
    }
}
