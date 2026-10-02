package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionRequestDto {

    @NotBlank
    private String medicineName;

    private String dosage;

    private String frequency;

    @Positive
    private Integer durationDays;

    @Size(max = 300)
    private String instructions;
}
