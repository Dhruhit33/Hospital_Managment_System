package com.example.me.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentResponseDto {
    private Long id;
    private LocalDateTime appointmentTime;
    private String reason;
    private DoctorDto doctor;
    private PatientDto patient;
    private com.example.me.hospitalmanagement.entity.type.AppointmentStatus status;
    private Long cancelledBy;
    private String cancelReason;
    private LocalDateTime cancelledAt;
    private Long billId;
    private String billStatus;
    private java.math.BigDecimal billTotal;
    private java.math.BigDecimal patientPayable;
}
