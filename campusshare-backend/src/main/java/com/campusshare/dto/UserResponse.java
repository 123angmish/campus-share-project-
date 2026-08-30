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
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String department;
    private Integer year;
    private String contactNumber;
    private Boolean emailVerified;
    private Double reputationScore;
    private Integer totalReviews;
    private String role;
    private Boolean isProMember;
    private LocalDateTime proExpiresAt;
    private Integer freeBoostsAvailable;
    private String hostelBlock;
    private String roomNumber;

    public static UserResponse fromUser(User user) {
        boolean proActive = Boolean.TRUE.equals(user.getIsProMember()) &&
                (user.getProExpiresAt() == null || user.getProExpiresAt().isAfter(LocalDateTime.now()));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .year(user.getYear())
                .contactNumber(user.getContactNumber())
                .emailVerified(user.getEmailVerified())
                .reputationScore(user.getReputationScore())
                .totalReviews(user.getTotalReviews())
                .role(user.getRole().name())
                .isProMember(proActive)
                .proExpiresAt(user.getProExpiresAt())
                .freeBoostsAvailable(user.getFreeBoostsAvailable() != null ? user.getFreeBoostsAvailable() : 0)
                .hostelBlock(user.getHostelBlock())
                .roomNumber(user.getRoomNumber())
                .build();
    }
}
