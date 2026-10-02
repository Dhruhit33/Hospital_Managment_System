package com.example.me.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DoctorLeaveResponseDto {

    private Long id;
    private Long doctorId;
    private LocalDate leaveDate;
    private String reason;
}
