package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.dto.DashboardDto;
import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import com.example.me.hospitalmanagement.entity.type.BillStatus;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.repository.*;
import com.example.me.hospitalmanagement.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    public DashboardDto getDashboardStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        Long totalPatients = userRepository.findByRolesContaining(RoleType.PATIENT, PageRequest.of(0, 1)).getTotalElements();
        Long totalDoctors = userRepository.findByRolesContaining(RoleType.DOCTOR, PageRequest.of(0, 1)).getTotalElements();
        Long totalUsers = userRepository.count();
        Long totalAdmins = userRepository.findByRolesContaining(RoleType.ADMIN, PageRequest.of(0, 1)).getTotalElements();
        Long totalDepartments = departmentRepository.count();
        Long appointmentsToday = appointmentRepository.countAppointmentsToday(startOfDay, endOfDay);

        List<Object[]> statusCounts = appointmentRepository.countAppointmentsByStatus();
        Map<AppointmentStatus, Long> appointmentsByStatus = statusCounts.stream()
                .collect(Collectors.toMap(
                        obj -> (AppointmentStatus) obj[0],
                        obj -> (Long) obj[1]
                ));

        List<Object[]> docAppointments = appointmentRepository.countAppointmentsPerDoctor(PageRequest.of(0, 10));
        List<DashboardDto.DoctorAppointmentCountDto> appointmentsPerDoctor = docAppointments.stream()
                .map(obj -> new DashboardDto.DoctorAppointmentCountDto((String) obj[0], (Long) obj[1]))
                .collect(Collectors.toList());

        var bloodGroupCounts = patientRepository.countByBloodGroup();

        BigDecimal revenue = billRepository.sumRevenueThisMonth(startOfMonth);
        if (revenue == null) {
            revenue = BigDecimal.ZERO;
        }

        Long pendingBillsCount = billRepository.countByStatus(BillStatus.PENDING);

        return DashboardDto.builder()
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .totalUsers(totalUsers)
                .totalAdmins(totalAdmins)
                .totalDepartments(totalDepartments)
                .appointmentsToday(appointmentsToday)
                .appointmentsByStatus(appointmentsByStatus)
                .appointmentsPerDoctor(appointmentsPerDoctor)
                .bloodGroupCounts(bloodGroupCounts)
                .revenueThisMonth(revenue)
                .pendingBillsCount(pendingBillsCount)
                .build();
    }
}
