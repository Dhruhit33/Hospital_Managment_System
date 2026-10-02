package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.AppointmentResponseDto;
import com.example.me.hospitalmanagement.dto.DoctorDto;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.service.AppointmentService;
import com.example.me.hospitalmanagement.service.DoctorService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/doctor")
@Validated
public class DoctorController {

    private final DoctorService doctorService;
    private final AppointmentService appointmentService;
    private final com.example.me.hospitalmanagement.service.SlotService slotService;

    @GetMapping
    public ResponseEntity<Page<DoctorDto>> getAllDoctors(
            @RequestParam(value = "page", defaultValue = "0") @Min(0) Integer pageNumber,
            @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(100) Integer pageSize
    ) {
        return ResponseEntity.ok(doctorService.getAllDoctorsPaginated(pageNumber, pageSize));
    }

    @GetMapping("/all")
    public ResponseEntity<List<DoctorDto>> getAllDoctorsList() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDto> findDoctorByDoctorId(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(doctorService.getDoctorId(id));
    }

    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponseDto>> getAllAppointments(
            @RequestParam(required = false) Long doctorId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean isDoctor = user.getRoles() != null && user.getRoles().stream().anyMatch(r -> r.name().equals("DOCTOR"));
        boolean isAdmin = user.getRoles() != null && user.getRoles().stream().anyMatch(r -> r.name().equals("ADMIN"));

        // If the authenticated user is a DOCTOR (even if they also hold ADMIN role), return only their own appointments
        if (isDoctor) {
            return ResponseEntity.ok(appointmentService.getAllAppointmentOfDoctor(user.getId()));
        }

        // If an admin requests appointments for a specific doctor
        if (doctorId != null) {
            return ResponseEntity.ok(appointmentService.getAllAppointmentOfDoctor(doctorId));
        }

        // Pure admin fallback
        if (isAdmin) {
            return ResponseEntity.ok(appointmentService.getAllAppointments());
        }

        return ResponseEntity.ok(appointmentService.getAllAppointmentOfDoctor(user.getId()));
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping("/availability")
    public ResponseEntity<com.example.me.hospitalmanagement.dto.DoctorAvailabilityResponseDto> setAvailability(
            @Validated @RequestBody com.example.me.hospitalmanagement.dto.DoctorAvailabilityRequestDto requestDto) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(doctorService.setAvailability(user.getId(), requestDto));
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @GetMapping("/availability")
    public ResponseEntity<com.example.me.hospitalmanagement.dto.DoctorAvailabilityResponseDto> getOwnAvailability() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(doctorService.getAvailability(user.getId()));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<com.example.me.hospitalmanagement.dto.DoctorAvailabilityResponseDto> getAvailabilityByDoctorId(
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(doctorService.getAvailabilityByDoctorId(id));
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping("/leave")
    public ResponseEntity<com.example.me.hospitalmanagement.dto.DoctorLeaveResponseDto> addLeave(
            @Validated @RequestBody com.example.me.hospitalmanagement.dto.DoctorLeaveRequestDto requestDto) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(doctorService.addLeave(user.getId(), requestDto));
    }

    @GetMapping("/slots")
    public ResponseEntity<com.example.me.hospitalmanagement.dto.SlotResponseDto> getAvailableSlots(
            @RequestParam("doctorId") @Positive Long doctorId,
            @RequestParam("date") @NotNull java.time.LocalDate date) {
        return ResponseEntity.ok(slotService.getAvailableSlots(doctorId, date));
    }

    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    @GetMapping("/patients")
    public ResponseEntity<List<com.example.me.hospitalmanagement.dto.DoctorPatientSummaryDto>> getDoctorPatients() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(doctorService.getPatientsOfDoctor(user.getId()));
    }
}
