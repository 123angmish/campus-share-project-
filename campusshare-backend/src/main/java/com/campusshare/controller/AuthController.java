package com.campusshare.controller;

import com.campusshare.dto.*;
import com.campusshare.security.UserPrincipal;
import com.campusshare.service.AuthCookieService;
import com.campusshare.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final AuthCookieService cookies;

    @PostMapping("/signup")
    public ResponseEntity<JwtAuthResponse> signup(@Valid @RequestBody SignupRequest request, HttpServletResponse response) {
        return ResponseEntity.ok(secureResponse(authService.signup(request), response, true));
    }

    @PostMapping("/login")
    public ResponseEntity<JwtAuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        boolean rememberMe = request.getRememberMe() == null || request.getRememberMe();
        return ResponseEntity.ok(secureResponse(authService.login(request), response, rememberMe));
    }

    @PostMapping("/refresh")
    public ResponseEntity<JwtAuthResponse> refresh(
            @CookieValue(value = "${app.auth.refresh-cookie-name:campusshare_refresh}", required = false) String defaultCookie,
            @RequestHeader(value = "X-Refresh-Token", required = false) String apiClientRefreshToken,
            HttpServletResponse response) {
        String raw = defaultCookie != null ? defaultCookie : apiClientRefreshToken;
        return ResponseEntity.ok(secureResponse(authService.refresh(raw), response, true));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal UserPrincipal user,
                                    @CookieValue(value = "${app.auth.refresh-cookie-name:campusshare_refresh}", required = false) String refresh,
                                    HttpServletResponse response) {
        authService.logout(user == null ? null : user.getId(), refresh);
        cookies.clearRefreshCookie(response);
        return ResponseEntity.ok(Map.of("message", "Signed out"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(authService.me(user.getId()));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verify(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verified. You can sign in now."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resend(@RequestBody Map<String, String> body) {
        authService.resendVerification(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "If eligible, a verification email has been sent"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        String token = authService.forgotPassword(request.getEmail());
        Map<String, Object> resp = new java.util.HashMap<>();
        if (token != null) {
            resp.put("message", "Password reset link generated successfully.");
            resp.put("accountFound", true);
            resp.put("devResetToken", token);
            resp.put("devResetUrl", "/reset-password?token=" + token);
        } else {
            resp.put("message", "No registered account found with this email. Please check your email or sign up.");
            resp.put("accountFound", false);
        }
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> reset(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password updated. Existing sessions were revoked."));
    }

    private JwtAuthResponse secureResponse(JwtAuthResponse result, HttpServletResponse response, boolean rememberMe) {
        if (result.getRefreshToken() != null && !result.getRefreshToken().isBlank()) {
            cookies.setRefreshCookie(response, result.getRefreshToken(), rememberMe);
        }
        return result;
    }
}
