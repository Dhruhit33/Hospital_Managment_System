package com.example.me.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordResponseDto {
    private Long id;
    private Long appointmentId;
    private Long doctorId;
    private Long patientId;
    private String diagnosis;
    private String notes;
    private LocalDate followUpDate;
    private List<PrescriptionResponseDto> prescriptions;
    private String doctorName;
    private String doctorSpecialization;
    private String patientName;
    private String attachmentName;
    private String attachmentType;
    private String attachmentSize;
    private String attachmentData;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
