package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OnboardDoctorRequestDto {

    @NotNull(message = "User ID is required")
    @Positive(message = "User ID must be positive")
    private Long userId;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Specialization is required")
    @Size(max = 200, message = "Specialization must not exceed 200 characters")
    private String specialization;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    private Long departmentId;

    public OnboardDoctorRequestDto(Long userId, String specialization, String name, String email) {
        this.userId = userId;
        this.specialization = specialization;
        this.name = name;
        this.email = email;
    }
}
