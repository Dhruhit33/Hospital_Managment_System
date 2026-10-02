package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.MedicalRecordRequestDto;
import com.example.me.hospitalmanagement.dto.MedicalRecordResponseDto;
import com.example.me.hospitalmanagement.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping("/doctor/appointments/{id}/record")
    @PreAuthorize("hasRole('DOCTOR') and hasAuthority('record:write')")
    public ResponseEntity<MedicalRecordResponseDto> createRecord(
            @PathVariable Long id,
            @Valid @RequestBody MedicalRecordRequestDto requestDto) {
        return new ResponseEntity<>(medicalRecordService.createMedicalRecord(id, requestDto), HttpStatus.CREATED);
    }

    @PostMapping("/doctor/patients/{patientId}/record")
    @PreAuthorize("hasRole('DOCTOR') and hasAuthority('record:write')")
    public ResponseEntity<MedicalRecordResponseDto> createRecordForPatient(
            @PathVariable Long patientId,
            @Valid @RequestBody MedicalRecordRequestDto requestDto) {
        return new ResponseEntity<>(medicalRecordService.createOrUpdateRecordForPatient(patientId, requestDto), HttpStatus.CREATED);
    }

    @PutMapping("/doctor/records/{id}")
    @PreAuthorize("hasRole('DOCTOR') and hasAuthority('record:write')")
    public ResponseEntity<MedicalRecordResponseDto> updateRecord(
            @PathVariable Long id,
            @Valid @RequestBody MedicalRecordRequestDto requestDto) {
        return ResponseEntity.ok(medicalRecordService.updateMedicalRecord(id, requestDto));
    }

    @GetMapping("/patient/records")
    @PreAuthorize("hasRole('PATIENT') and hasAuthority('record:read')")
    public ResponseEntity<Page<MedicalRecordResponseDto>> getPatientRecords(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(medicalRecordService.getPatientRecords(pageable));
    }

    @GetMapping("/patient/records/{id}")
    @PreAuthorize("hasRole('PATIENT') and hasAuthority('record:read')")
    public ResponseEntity<MedicalRecordResponseDto> getPatientRecordById(@PathVariable Long id) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordById(id));
    }

    @GetMapping("/doctor/patients/{patientId}/records")
    @PreAuthorize("hasRole('DOCTOR') and hasAuthority('record:read')")
    public ResponseEntity<Page<MedicalRecordResponseDto>> getRecordsByPatientIdForDoctor(
            @PathVariable Long patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(medicalRecordService.getRecordsByPatientIdForDoctor(patientId, pageable));
    }

    @GetMapping("/admin/records/{id}")
    @PreAuthorize("hasRole('ADMIN') and hasAuthority('record:read')")
    public ResponseEntity<MedicalRecordResponseDto> getAdminRecordById(@PathVariable Long id) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordByIdForAdmin(id));
    }

    @GetMapping("/admin/records")
    @PreAuthorize("hasRole('ADMIN') and hasAuthority('record:read')")
    public ResponseEntity<Page<MedicalRecordResponseDto>> getAllRecordsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(medicalRecordService.getAllRecordsForAdmin(pageable));
    }

    @GetMapping("/doctor/records")
    @PreAuthorize("hasRole('DOCTOR') and hasAuthority('record:read')")
    public ResponseEntity<Page<MedicalRecordResponseDto>> getDoctorRecords(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(medicalRecordService.getAllRecordsForDoctor(pageable));
    }

    @GetMapping({"/admin/records/appointment/{appointmentId}", "/doctor/appointments/{appointmentId}/record", "/patient/appointments/{appointmentId}/record"})
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<MedicalRecordResponseDto> getRecordByAppointmentId(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(medicalRecordService.getRecordByAppointmentId(appointmentId));
    }

    @DeleteMapping("/patient/records/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<Void> deletePatientRecord(@PathVariable Long id) {
        medicalRecordService.deleteMedicalRecordByPatient(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/doctor/records/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Void> deleteDoctorRecord(@PathVariable Long id) {
        medicalRecordService.deleteMedicalRecordByDoctor(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/records/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAdminRecord(@PathVariable Long id) {
        medicalRecordService.deleteMedicalRecordByAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
