package com.example.me.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionResponseDto {
    private Long id;
    private String medicineName;
    private String dosage;
    private String frequency;
    private Integer durationDays;
    private String instructions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
