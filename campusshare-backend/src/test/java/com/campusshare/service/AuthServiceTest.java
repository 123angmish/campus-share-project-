package com.campusshare.service;

import com.campusshare.dto.JwtAuthResponse;
import com.campusshare.dto.SignupRequest;
import com.campusshare.model.User;
import com.campusshare.repository.UserRepository;
import com.campusshare.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserRepository users;
    @Mock PasswordEncoder encoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtTokenProvider tokens;
    @Mock EmailService emailService;

    AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(users, encoder, authenticationManager, tokens, emailService);
        ReflectionTestUtils.setField(service, "allowedDomains", List.of("college.edu"));
        ReflectionTestUtils.setField(service, "requireVerification", false);
        ReflectionTestUtils.setField(service, "refreshExpiration", 2_592_000_000L);
    }

    @Test
    void signupNormalizesEmailHashesPasswordAndCreatesRotatingSession() {
        SignupRequest request = signupRequest();
        AtomicReference<User> persisted = new AtomicReference<>();
        when(users.existsByEmail("student@college.edu")).thenReturn(false);
        when(encoder.encode("StrongPass1")).thenReturn("bcrypt-hash");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            if (user.getId() == null) user.setId(11L);
            persisted.set(user);
            return user;
        });
        when(tokens.generateTokenFromUserId(11L)).thenReturn("access-token");
        when(tokens.getExpirationMs()).thenReturn(900_000L);

        JwtAuthResponse result = service.signup(request);

        assertEquals("access-token", result.getAccessToken());
        assertNotNull(result.getRefreshToken());
        assertEquals("student@college.edu", persisted.get().getEmail());
        assertEquals("bcrypt-hash", persisted.get().getPassword());
        assertTrue(persisted.get().getEmailVerified());
        assertNotNull(persisted.get().getRefreshTokenHash());
        assertNotEquals(result.getRefreshToken(), persisted.get().getRefreshTokenHash(), "raw refresh token must never be stored");
    }

    @Test
    void refreshRotatesRawTokenAndReplacesStoredHash() {
        User user = User.builder().id(11L).name("Student").email("student@college.edu").password("hash")
                .department("ECE").year(4).contactNumber("9999999999").emailVerified(true).active(true).build();
        user.setRefreshTokenExpiry(java.time.LocalDateTime.now().plusHours(1));
        when(users.findByRefreshTokenHash(anyString())).thenReturn(Optional.of(user));
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokens.generateTokenFromUserId(11L)).thenReturn("new-access");
        when(tokens.getExpirationMs()).thenReturn(900_000L);

        JwtAuthResponse result = service.refresh("old-raw-refresh-token");

        assertEquals("new-access", result.getAccessToken());
        assertNotNull(result.getRefreshToken());
        assertNotEquals("old-raw-refresh-token", result.getRefreshToken());
        assertNotNull(user.getRefreshTokenHash());
    }

    @Test
    void rejectsUnapprovedEmailDomain() {
        SignupRequest request = signupRequest();
        request.setEmail("student@publicmail.com");

        RuntimeException error = assertThrows(RuntimeException.class, () -> service.signup(request));
        assertTrue(error.getMessage().contains("approved college email"));
        verify(users, never()).save(any());
    }

    private SignupRequest signupRequest() {
        SignupRequest request = new SignupRequest();
        request.setName("Student");
        request.setEmail(" Student@College.edu ");
        request.setPassword("StrongPass1");
        request.setDepartment("ECE");
        request.setYear(4);
        request.setContactNumber("9999999999");
        return request;
    }
}
