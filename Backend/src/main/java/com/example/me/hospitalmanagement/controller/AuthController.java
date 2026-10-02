package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.security.AuthService;
import com.example.me.hospitalmanagement.dto.LoginRequestDto;
import com.example.me.hospitalmanagement.dto.LoginResponseDto;
import com.example.me.hospitalmanagement.dto.SignUpRequestDto;
import com.example.me.hospitalmanagement.dto.SignupResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {
    private final AuthService authService;
    private final com.example.me.hospitalmanagement.security.RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto loginRequestDto) {
        return ResponseEntity.ok(authService.login(loginRequestDto));
    }

    @PostMapping("/verify-login-otp")
    public ResponseEntity<LoginResponseDto> verifyLoginOtp(@Valid @RequestBody com.example.me.hospitalmanagement.dto.VerifyLoginOtpRequestDto requestDto) {
        return ResponseEntity.ok(authService.verifyLoginOtp(requestDto));
    }

    @PostMapping("/resend-login-otp")
    public ResponseEntity<java.util.Map<String, String>> resendLoginOtp(@Valid @RequestBody com.example.me.hospitalmanagement.dto.SendOtpRequestDto requestDto) {
        authService.resendLoginOtp(requestDto.getEmail());
        return ResponseEntity.ok(java.util.Map.of("message", "A new verification code has been dispatched."));
    }

    @PostMapping("/send-signup-otp")
    public ResponseEntity<java.util.Map<String, String>> sendSignupOtp(@Valid @RequestBody com.example.me.hospitalmanagement.dto.SendOtpRequestDto requestDto) {
        authService.sendSignupOtp(requestDto.getEmail());
        return ResponseEntity.ok(java.util.Map.of("message", "A 6-digit verification code has been sent to " + requestDto.getEmail()));
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponseDto> signup(@Valid @RequestBody SignUpRequestDto signupRequestDto) {
        return ResponseEntity.ok(authService.signup(signupRequestDto));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDto> refresh(@Valid @RequestBody com.example.me.hospitalmanagement.dto.RefreshTokenRequestDto requestDto) {
        return ResponseEntity.ok(refreshTokenService.refresh(requestDto.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody com.example.me.hospitalmanagement.dto.RefreshTokenRequestDto requestDto) {
        refreshTokenService.logout(requestDto.getRefreshToken());
        return ResponseEntity.ok().build();
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<LoginResponseDto> getCurrentUser() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() instanceof String) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        com.example.me.hospitalmanagement.entity.User user = (com.example.me.hospitalmanagement.entity.User) auth.getPrincipal();
        String resolvedName = authService.resolveUserName(user);
        java.util.Set<String> roleStrings = user.getRoles() != null
                ? user.getRoles().stream().map(Enum::name).collect(java.util.stream.Collectors.toSet())
                : java.util.Set.of("PATIENT");

        return ResponseEntity.ok(new LoginResponseDto(null, user.getId(), null, user.getUsername(), resolvedName, roleStrings));
    }
}
