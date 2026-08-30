package com.campusshare.config;

import com.campusshare.model.User;
import com.campusshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        userRepository.findByEmail("angel@gmail.com").ifPresent(user -> {
            user.setRole(User.Role.ADMIN);
            user.setEmailVerified(true);
            userRepository.save(user);
        });

        if (!userRepository.existsByEmail("admin@college.edu")) {
            User admin = User.builder()
                    .name("Admin Angel")
                    .email("admin@college.edu")
                    .password(passwordEncoder.encode("Password123"))
                    .department("Administration")
                    .year(4)
                    .contactNumber("9999999999")
                    .role(User.Role.ADMIN)
                    .emailVerified(true)
                    .reputationScore(5.0)
                    .isProMember(true)
                    .build();
            userRepository.save(admin);
        }
    }
}
