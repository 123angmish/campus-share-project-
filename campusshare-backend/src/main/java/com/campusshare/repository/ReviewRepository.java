package com.campusshare.repository;

import com.campusshare.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRevieweeIdOrderByCreatedAtDesc(Long revieweeId);
    List<Review> findByRevieweeIdAndFlaggedFalseOrderByCreatedAtDesc(Long revieweeId);
    List<Review> findByTransactionIdOrderByCreatedAtAsc(Long transactionId);
    boolean existsByTransactionIdAndReviewerId(Long transactionId, Long reviewerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee.id = :userId AND r.flagged = false")
    Double getAverageRatingForUser(Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.reviewee.id = :userId AND r.flagged = false")
    Long countReviewsForUser(Long userId);

    @Query("SELECT r FROM Review r WHERE r.flagged = true ORDER BY r.createdAt DESC")
    List<Review> findFlaggedReviews();
}
