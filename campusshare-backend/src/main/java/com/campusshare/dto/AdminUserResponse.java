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
public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private String department;
    private Integer year;
    private Boolean emailVerified;
    private Double reputationScore;
    private Integer totalReviews;
    private String role;
    private Boolean active;
    private Integer reportCount;
    private LocalDateTime createdAt;

    public static AdminUserResponse from(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .year(user.getYear())
                .emailVerified(user.getEmailVerified())
                .reputationScore(user.getReputationScore())
                .totalReviews(user.getTotalReviews())
                .role(user.getRole().name())
                .active(user.getActive())
                .reportCount(user.getReportCount())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
