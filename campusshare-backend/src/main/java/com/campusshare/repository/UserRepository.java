package com.campusshare.repository;

import com.campusshare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByVerificationToken(String token);

    boolean existsByEmail(String email);

    Optional<User> findByRefreshTokenHash(String refreshTokenHash);

    Optional<User> findByPasswordResetTokenHash(String passwordResetTokenHash);

    long countByEmailVerifiedTrueAndActiveTrue();
    long countByActiveTrue();

    @Query("SELECT u FROM User u WHERE u.id = :userId AND u.emailVerified = true AND u.active = true")
    Optional<User> findActiveVerifiedUser(Long userId);
}
