package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.AppointmentResponseDto;
import com.example.me.hospitalmanagement.dto.CreateAppointmentDto;
import com.example.me.hospitalmanagement.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
@Validated
public class PatientController {

    private final AppointmentService appointmentService;
    private final com.example.me.hospitalmanagement.service.PatientService patientService;

    @GetMapping("/profile")
    public ResponseEntity<com.example.me.hospitalmanagement.dto.PatientDto> getMyProfile() {
        com.example.me.hospitalmanagement.entity.User user = (com.example.me.hospitalmanagement.entity.User)
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(patientService.getPatientProfile(user.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<com.example.me.hospitalmanagement.dto.PatientDto> updateMyProfile(
            @Valid @RequestBody com.example.me.hospitalmanagement.dto.UpdatePatientProfileDto dto) {
        com.example.me.hospitalmanagement.entity.User user = (com.example.me.hospitalmanagement.entity.User)
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(patientService.updatePatientProfile(user.getId(), dto));
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponseDto>> getMyAppointments() {
        com.example.me.hospitalmanagement.entity.User user = (com.example.me.hospitalmanagement.entity.User)
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(appointmentService.getAllAppointmentsOfPatient(user.getId()));
    }
}
