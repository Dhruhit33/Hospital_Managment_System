package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.AppointmentResponseDto;
import com.example.me.hospitalmanagement.dto.CreateUserRequestDto;
import com.example.me.hospitalmanagement.dto.DashboardDto;
import com.example.me.hospitalmanagement.dto.DoctorDto;
import com.example.me.hospitalmanagement.dto.OnboardDoctorRequestDto;
import com.example.me.hospitalmanagement.dto.PatientDto;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.service.AdminUserService;
import com.example.me.hospitalmanagement.service.AppointmentService;
import com.example.me.hospitalmanagement.service.DashboardService;
import com.example.me.hospitalmanagement.service.DoctorService;
import com.example.me.hospitalmanagement.service.PatientService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Validated
public class AdminController {
    private final PatientService patientService;
    private final DoctorService doctorService;
    private final DashboardService dashboardService;
    private final AdminUserService adminUserService;
    private final AppointmentService appointmentService;

    @GetMapping("/appointments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponseDto>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @PostMapping("/appointments/cleanup-completed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> cleanupCompletedAppointments(
            @RequestParam(defaultValue = "0") int olderThanDays
    ) {
        LocalDateTime cutoff = olderThanDays > 0 ? LocalDateTime.now().minusDays(olderThanDays) : LocalDateTime.now();
        int deleted = appointmentService.cleanupCompletedSettledAppointments(cutoff);
        return ResponseEntity.ok(java.util.Map.of(
                "deletedCount", deleted,
                "message", "Purged " + deleted + " completed and settled visit(s) whose billing cycle was cleared."
        ));
    }

    @GetMapping("/patients")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<PatientDto>> getPatients(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bornAfter,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) Integer pageNumber,
            @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(100) Integer pageSize
    ) {
        return ResponseEntity.ok(patientService.searchPatients(name, bloodGroup, bornAfter, PageRequest.of(pageNumber, Math.min(pageSize, 100))));
    }

    @PostMapping("/onBoardNewDoctor")
    public ResponseEntity<DoctorDto> onBoardNewDoctor(@Valid @RequestBody OnboardDoctorRequestDto onboardDoctorRequestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.onBoardNewDoctor(onboardDoctorRequestDto));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardDto> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Object>> getUsers(
            @RequestParam(required = false) RoleType role,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) Integer pageNumber,
            @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(100) Integer pageSize
    ) {
        return ResponseEntity.ok(adminUserService.getUsers(role, PageRequest.of(pageNumber, Math.min(pageSize, 100))));
    }

    @PutMapping("/users/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateRoles(
            @PathVariable Long id,
            @RequestBody Set<RoleType> roles
    ) {
        adminUserService.updateRoles(id, roles);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> disableUser(@PathVariable Long id) {
        adminUserService.setEnabled(id, false);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> enableUser(@PathVariable Long id) {
        adminUserService.setEnabled(id, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> createUser(@Valid @RequestBody CreateUserRequestDto createUserRequestDto) {
        adminUserService.createUser(createUserRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
