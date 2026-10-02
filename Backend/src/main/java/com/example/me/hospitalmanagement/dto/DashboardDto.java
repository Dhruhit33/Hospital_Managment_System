package com.example.me.hospitalmanagement.dto;

import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDto {
    private Long totalPatients;
    private Long totalDoctors;
    private Long totalUsers;
    private Long totalAdmins;
    private Long totalDepartments;
    private Long appointmentsToday;
    private Map<AppointmentStatus, Long> appointmentsByStatus;
    private List<DoctorAppointmentCountDto> appointmentsPerDoctor;
    private List<BloodGroupCountResponse> bloodGroupCounts;
    private BigDecimal revenueThisMonth;
    private Long pendingBillsCount;
    
    @Data
    @AllArgsConstructor
    public static class DoctorAppointmentCountDto {
        private String doctorName;
        private Long count;
    }
}
