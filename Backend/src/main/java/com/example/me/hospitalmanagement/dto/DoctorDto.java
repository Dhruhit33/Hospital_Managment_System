package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DoctorDto {
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(max = 200, message = "Specialization must not exceed 200 characters")
    private String specialization;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    private Long departmentId;
    private String departmentName;

    public DoctorDto(Long id, String name, String specialization, String email) {
        this.id = id;
        this.name = name;
        this.specialization = specialization;
        this.email = email;
    }
}
