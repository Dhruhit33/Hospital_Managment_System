package com.example.me.hospitalmanagement.dto;

import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import com.example.me.hospitalmanagement.entity.type.BloodGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DoctorPatientSummaryDto {
    private Long id;
    private String name;
    private String email;
    private String gender;
    private BloodGroup bloodGroup;
    private LocalDate birthDate;
    private String emergencyContact;
    private String allergies;
    private Integer totalAppointments;
    private LocalDateTime lastAppointmentTime;
    private LocalDateTime nextAppointmentTime;
    private String latestReason;
    private AppointmentStatus latestStatus;
}
