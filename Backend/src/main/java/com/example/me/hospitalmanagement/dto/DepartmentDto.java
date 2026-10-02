package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDto {
    private Long id;

    @NotBlank(message = "Department name is required")
    private String name;

    private Long headDoctorId;
    private String headDoctorName;
    private String headDoctorSpecialization;
    private Integer doctorCount;
    private java.util.List<DoctorDto> doctors;
}
