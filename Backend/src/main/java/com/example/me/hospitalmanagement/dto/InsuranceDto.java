package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InsuranceDto {
    private Long id;

    @NotBlank(message = "Policy number is required")
    private String policyNumber;

    @NotBlank(message = "Provider is required")
    private String provider;

    private LocalDate validUntil;

    private Integer coveragePercent;
}
