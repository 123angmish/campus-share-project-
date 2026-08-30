package com.campusshare.dto;

import com.campusshare.model.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long transactionId;
    private PublicUserResponse reviewer;
    private PublicUserResponse reviewee;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .transactionId(review.getTransaction().getId())
                .reviewer(PublicUserResponse.fromUser(review.getReviewer()))
                .reviewee(PublicUserResponse.fromUser(review.getReviewee()))
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
