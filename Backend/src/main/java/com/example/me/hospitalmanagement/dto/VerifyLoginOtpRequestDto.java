package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VerifyLoginOtpRequestDto {
    @NotBlank(message = "Username or Email is required")
    private String email;

    @NotBlank(message = "OTP is required")
    private String otp;
}
