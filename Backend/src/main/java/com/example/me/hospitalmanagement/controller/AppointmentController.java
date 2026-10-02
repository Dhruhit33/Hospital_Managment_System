package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.AppointmentResponseDto;
import com.example.me.hospitalmanagement.dto.CancelAppointmentDto;
import com.example.me.hospitalmanagement.dto.CreateAppointmentDto;
import com.example.me.hospitalmanagement.dto.RescheduleAppointmentDto;
import com.example.me.hospitalmanagement.dto.UpdateAppointmentStatusDto;
import com.example.me.hospitalmanagement.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Validated
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponseDto> createNewAppointment(
            @Valid @RequestBody CreateAppointmentDto createAppointmentDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.createNewAppointment(createAppointmentDto));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponseDto> cancelAppointment(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CancelAppointmentDto cancelDto) {
        String reason = cancelDto != null ? cancelDto.getReason() : null;
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, reason));
    }

    @PostMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponseDto> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleAppointmentDto rescheduleDto) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, rescheduleDto.getNewAppointmentTime()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponseDto> updateAppointmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusDto updateDto) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, updateDto.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}
