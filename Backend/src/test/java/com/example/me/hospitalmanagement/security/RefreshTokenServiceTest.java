package com.example.me.hospitalmanagement.security;

import com.example.me.hospitalmanagement.dto.LoginResponseDto;
import com.example.me.hospitalmanagement.entity.RefreshToken;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.error.exception.ExpiredRefreshTokenException;
import com.example.me.hospitalmanagement.error.exception.InvalidRefreshTokenException;
import com.example.me.hospitalmanagement.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private AuthUtil authUtil;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    private User testUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(refreshTokenService, "expiryDays", 7);
        testUser = User.builder().id(42L).username("testuser@hospital.com").build();
    }

    @Test
    void generateRefreshToken_ReturnsRawTokenAndSavesHashedToken() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String rawToken = refreshTokenService.generateRefreshToken(testUser);

        assertNotNull(rawToken);
        assertFalse(rawToken.isBlank());

        // Verify save was called with the SHA-256 hash, not the raw token
        verify(refreshTokenRepository).save(argThat(token -> {
            assertNotNull(token.getTokenHash());
            assertNotEquals(rawToken, token.getTokenHash());
            assertEquals(64, token.getTokenHash().length());
            assertEquals(testUser, token.getUser());
            assertFalse(token.isRevoked());
            assertTrue(token.getExpiresAt().isAfter(LocalDateTime.now()));
            return true;
        }));
    }

    @Test
    void refresh_WithValidToken_IssuesNewTokensAndRevokesOld() {
        String rawToken = "sample-raw-refresh-token-123456789";
        String tokenHash = refreshTokenService.hashToken(rawToken);

        RefreshToken oldToken = RefreshToken.builder()
                .id(1L)
                .tokenHash(tokenHash)
                .user(testUser)
                .expiresAt(LocalDateTime.now().plusDays(5))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(oldToken));
        when(authUtil.generateAccessToken(testUser)).thenReturn("new-access-jwt");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LoginResponseDto response = refreshTokenService.refresh(rawToken);

        assertNotNull(response);
        assertEquals("new-access-jwt", response.getJwt());
        assertEquals(testUser.getId(), response.getUserId());
        assertNotNull(response.getRefreshToken());
        assertNotEquals(rawToken, response.getRefreshToken());

        // Verify old token was revoked
        assertTrue(oldToken.isRevoked());
        verify(refreshTokenRepository, atLeastOnce()).save(oldToken);
    }

    @Test
    void refresh_WithAlreadyUsedToken_RevokesAllTokensAndThrows401() {
        String rawToken = "already-revoked-token-123456789";
        String tokenHash = refreshTokenService.hashToken(rawToken);

        RefreshToken revokedToken = RefreshToken.builder()
                .id(2L)
                .tokenHash(tokenHash)
                .user(testUser)
                .expiresAt(LocalDateTime.now().plusDays(5))
                .revoked(true) // already revoked!
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(revokedToken));

        assertThrows(InvalidRefreshTokenException.class, () -> refreshTokenService.refresh(rawToken));

        // Verify all active tokens for this user were revoked (theft signal)
        verify(refreshTokenRepository, times(1)).revokeAllActiveByUserId(testUser.getId());
    }

    @Test
    void refresh_WithExpiredToken_ThrowsExpiredException() {
        String rawToken = "expired-token-123456789";
        String tokenHash = refreshTokenService.hashToken(rawToken);

        RefreshToken expiredToken = RefreshToken.builder()
                .id(3L)
                .tokenHash(tokenHash)
                .user(testUser)
                .expiresAt(LocalDateTime.now().minusHours(1)) // Expired!
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(expiredToken));

        assertThrows(ExpiredRefreshTokenException.class, () -> refreshTokenService.refresh(rawToken));
    }

    @Test
    void logout_RevokesToken_SoLaterRefreshFails() {
        String rawToken = "logout-token-123456789";
        String tokenHash = refreshTokenService.hashToken(rawToken);

        RefreshToken activeToken = RefreshToken.builder()
                .id(4L)
                .tokenHash(tokenHash)
                .user(testUser)
                .expiresAt(LocalDateTime.now().plusDays(3))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(activeToken));

        // Call logout
        refreshTokenService.logout(rawToken);

        // Verify token is now marked revoked
        assertTrue(activeToken.isRevoked());
        verify(refreshTokenRepository).save(activeToken);

        // If a later refresh with this token is attempted:
        assertThrows(InvalidRefreshTokenException.class, () -> refreshTokenService.refresh(rawToken));
    }
}
