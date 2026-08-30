package com.campusshare.dto;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class JwtAuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default private String tokenType="Bearer";
    private Long expiresIn;
    private Boolean requiresVerification;
    private UserResponse user;
}
