package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.RefreshToken;
import com.example.me.hospitalmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUserAndRevokedFalse(User user);

    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId AND r.revoked = false")
    int revokeAllActiveByUserId(@Param("userId") Long userId);

    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
}
