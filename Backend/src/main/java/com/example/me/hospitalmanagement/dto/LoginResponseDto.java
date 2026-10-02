package com.example.me.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoginResponseDto {
    private String jwt;
    private Long userId;
    private String refreshToken;
    private String username;
    private String name;
    private Set<String> roles;
    private boolean requiresOtp;
    private String message;

    public LoginResponseDto(String jwt, Long userId) {
        this.jwt = jwt;
        this.userId = userId;
    }

    public LoginResponseDto(String jwt, Long userId, String refreshToken) {
        this.jwt = jwt;
        this.userId = userId;
        this.refreshToken = refreshToken;
    }

    public LoginResponseDto(String jwt, Long userId, String refreshToken, String username, String name) {
        this.jwt = jwt;
        this.userId = userId;
        this.refreshToken = refreshToken;
        this.username = username;
        this.name = name;
    }

    public LoginResponseDto(String jwt, Long userId, String refreshToken, String username, String name, Set<String> roles) {
        this.jwt = jwt;
        this.userId = userId;
        this.refreshToken = refreshToken;
        this.username = username;
        this.name = name;
        this.roles = roles;
    }
}
