package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SendOtpRequestDto {
    @NotBlank(message = "Identifier or Email is required")
    private String email;
}
