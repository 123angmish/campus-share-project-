package com.campusshare.service;

import com.campusshare.dto.*;
import com.campusshare.model.User;
import com.campusshare.repository.UserRepository;
import com.campusshare.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    @Value("${email.allowed-domains}")
    private List<String> allowedDomains;

    @Value("${app.auth.require-email-verification:false}")
    private boolean requireVerification;

    @Value("${jwt.refresh-expiration:2592000000}")
    private long refreshExpiration;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public JwtAuthResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.getEmail());
        validateDomain(email);
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("An account with this email already exists.");
        }

        String verification = randomToken();
        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .department(request.getDepartment().trim())
                .year(request.getYear())
                .contactNumber(request.getContactNumber().trim())
                .hostelBlock(trimToNull(request.getHostelBlock()))
                .roomNumber(trimToNull(request.getRoomNumber()))
                .emailVerified(!requireVerification)
                .verificationToken(requireVerification ? verification : null)
                .verificationTokenExpiry(requireVerification ? LocalDateTime.now().plusHours(24) : null)
                .active(true)
                .role(User.Role.USER)
                .build();
        user = userRepository.save(user);

        if (requireVerification) {
            emailService.sendVerificationEmail(email, verification);
            return JwtAuthResponse.builder()
                    .requiresVerification(true)
                    .user(UserResponse.fromUser(user))
                    .build();
        }
        return createSession(user, true);
    }

    @Transactional
    public JwtAuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            throw new RuntimeException("Invalid email or password.");
        } catch (Exception ex) {
            throw new RuntimeException("Invalid email or password.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new RuntimeException("Your account is deactivated. Please contact campus admin.");
        }

        boolean rememberMe = request.getRememberMe() == null || request.getRememberMe();
        return createSession(user, rememberMe);
    }

    @Transactional
    public JwtAuthResponse refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new RuntimeException("Refresh session is missing. Please sign in.");
        }
        User user = userRepository.findByRefreshTokenHash(hash(rawRefreshToken))
                .orElseThrow(() -> new RuntimeException("Invalid refresh session. Please sign in again."));

        if (user.getRefreshTokenExpiry() == null || user.getRefreshTokenExpiry().isBefore(LocalDateTime.now())) {
            user.setRefreshTokenHash(null);
            user.setRefreshTokenExpiry(null);
            userRepository.save(user);
            throw new RuntimeException("Your session has expired. Please sign in again.");
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new RuntimeException("Account is deactivated. Please contact support.");
        }

        return createSession(user, true);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.fromUser(user);
    }

    @Transactional
    public void logout(Long userId, String rawRefreshToken) {
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user -> {
                user.setRefreshTokenHash(null);
                user.setRefreshTokenExpiry(null);
                userRepository.save(user);
            });
            return;
        }
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            userRepository.findByRefreshTokenHash(hash(rawRefreshToken)).ifPresent(user -> {
                user.setRefreshTokenHash(null);
                user.setRefreshTokenExpiry(null);
                userRepository.save(user);
            });
        }
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));
        if (user.getVerificationTokenExpiry() == null || user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification token expired");
        }
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);
    }

    @Transactional
    public void resendVerification(String email) {
        if (email == null || email.isBlank()) return;
        User user = userRepository.findByEmail(normalizeEmail(email)).orElse(null);
        if (user == null || Boolean.TRUE.equals(user.getEmailVerified())) return;
        String token = randomToken();
        user.setVerificationToken(token);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), token);
    }

    @Transactional
    public String forgotPassword(String email) {
        if (email == null || email.isBlank()) return null;
        String cleanEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(cleanEmail).orElse(null);
        if (user == null) {
            return null;
        }
        String raw = randomToken();
        user.setPasswordResetTokenHash(hash(raw));
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);
        emailService.sendPasswordResetEmail(user.getEmail(), raw);
        return raw;
    }

    @Transactional
    public void resetPassword(String token, String password) {
        User user = userRepository.findByPasswordResetTokenHash(hash(token))
                .orElseThrow(() -> new RuntimeException("Invalid or expired password reset link."));
        if (user.getPasswordResetTokenExpiry() == null || user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Password reset link has expired. Please request a new one.");
        }
        user.setPassword(passwordEncoder.encode(password));
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetTokenExpiry(null);
        user.setRefreshTokenHash(null);
        user.setRefreshTokenExpiry(null);
        userRepository.save(user);
    }

    private JwtAuthResponse createSession(User user, boolean rememberMe) {
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new RuntimeException("Account is deactivated.");
        }
        String refresh = randomToken();
        long expirySeconds = rememberMe ? (refreshExpiration / 1000) : 86400; // 30 days vs 1 day
        user.setRefreshTokenHash(hash(refresh));
        user.setRefreshTokenExpiry(LocalDateTime.now().plusSeconds(expirySeconds));
        userRepository.save(user);

        return JwtAuthResponse.builder()
                .accessToken(tokenProvider.generateTokenFromUserId(user.getId()))
                .refreshToken(refresh)
                .expiresIn(tokenProvider.getExpirationMs() / 1000)
                .requiresVerification(false)
                .user(UserResponse.fromUser(user))
                .build();
    }

    private void validateDomain(String email) {
        if (allowedDomains == null || allowedDomains.isEmpty() || allowedDomains.stream().anyMatch(s -> "*".equals(s.trim()))) {
            return;
        }
        String domain = email.substring(email.lastIndexOf('@') + 1).toLowerCase();
        boolean allowed = allowedDomains.stream().map(String::trim).map(String::toLowerCase).anyMatch(domain::equals);
        if (!allowed) {
            throw new RuntimeException("Use your approved college email address");
        }
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
