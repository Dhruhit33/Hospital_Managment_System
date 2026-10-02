package com.example.me.hospitalmanagement.config;

import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.type.AuthProviderType;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username:admin@hospital.com}")
    private String adminUsername;

    @Value("${admin.password:AdminPassword123!}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            User admin = User.builder()
                    .username(adminUsername)
                    .password(passwordEncoder.encode(adminPassword))
                    .authProviderType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.ADMIN))
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created successfully with username: {}", adminUsername);
        }
    }
}
