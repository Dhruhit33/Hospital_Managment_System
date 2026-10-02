package com.example.me.hospitalmanagement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordRequestDto {

    @NotBlank
    @Size(max = 1000)
    private String diagnosis;

    @Size(max = 2000)
    private String notes;

    private LocalDate followUpDate;

    @Valid
    private List<PrescriptionRequestDto> prescriptions;

    private String attachmentName;
    private String attachmentType;
    private String attachmentSize;
    private String attachmentData;
}
