package com.example.me.hospitalmanagement.security;

import com.example.me.hospitalmanagement.dto.LoginResponseDto;
import com.example.me.hospitalmanagement.entity.RefreshToken;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.error.exception.ExpiredRefreshTokenException;
import com.example.me.hospitalmanagement.error.exception.InvalidRefreshTokenException;
import com.example.me.hospitalmanagement.repository.RefreshTokenRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthUtil authUtil;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${refresh-token.expiry-days:7}")
    private int expiryDays;

    public String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidRefreshTokenException("Refresh token cannot be blank");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private String generateRawToken() {
        byte[] randomBytes = new byte[32]; // 256 bits of randomness
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    @Transactional
    public String generateRefreshToken(User user) {
        String rawToken = generateRawToken();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(expiryDays))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    @Transactional
    public LoginResponseDto refresh(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            log.warn("Refresh token not found for hash");
            throw new InvalidRefreshTokenException("Invalid refresh token");
        }

        RefreshToken token = tokenOpt.get();

        if (token.isRevoked()) {
            log.warn("Attempt to use already revoked refresh token for user id: {}. Revoking all active tokens!", token.getUser().getId());
            refreshTokenRepository.revokeAllActiveByUserId(token.getUser().getId());
            throw new InvalidRefreshTokenException("Refresh token has been revoked");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Refresh token expired for user id: {}", token.getUser().getId());
            throw new ExpiredRefreshTokenException("Refresh token has expired");
        }

        // Revoke the old token (rotation)
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        User user = token.getUser();
        String newRawRefreshToken = generateRefreshToken(user);
        String newAccessToken = authUtil.generateAccessToken(user);

        java.util.Set<String> roleStrings = user.getRoles() != null
                ? user.getRoles().stream().map(Enum::name).collect(java.util.stream.Collectors.toSet())
                : java.util.Set.of("PATIENT");
        String name = user.getName() != null && !user.getName().isBlank()
                ? user.getName()
                : user.getUsername().split("@")[0];

        return new LoginResponseDto(newAccessToken, user.getId(), newRawRefreshToken, user.getUsername(), name, roleStrings);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            log.info("Revoked refresh token on logout for user id: {}", token.getUser().getId());
        });
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Scheduled(fixedRate = 86400000)
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    @Transactional
    public void deleteExpiredTokens() {
        int deleted = refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        if (deleted > 0) {
            log.info("Deleted {} expired refresh tokens from database", deleted);
        }
    }
}
