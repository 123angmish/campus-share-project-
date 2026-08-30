package com.campusshare.dto;

import com.campusshare.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicUserResponse {
    private Long id;
    private String name;
    private String department;
    private Integer year;
    private Boolean emailVerified;
    private Double reputationScore;
    private Integer totalReviews;
    private Boolean isProMember;

    public static PublicUserResponse fromUser(User user) {
        if (user == null) return null;
        boolean proActive = Boolean.TRUE.equals(user.getIsProMember()) &&
                (user.getProExpiresAt() == null || user.getProExpiresAt().isAfter(LocalDateTime.now()));

        return PublicUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .department(user.getDepartment())
                .year(user.getYear())
                .emailVerified(user.getEmailVerified())
                .reputationScore(user.getReputationScore())
                .totalReviews(user.getTotalReviews())
                .isProMember(proActive)
                .build();
    }
}
