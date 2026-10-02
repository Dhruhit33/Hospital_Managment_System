package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.MedicalRecordRequestDto;
import com.example.me.hospitalmanagement.dto.MedicalRecordResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MedicalRecordService {
    MedicalRecordResponseDto createMedicalRecord(Long appointmentId, MedicalRecordRequestDto requestDto);
    MedicalRecordResponseDto createOrUpdateRecordForPatient(Long patientId, MedicalRecordRequestDto requestDto);
    MedicalRecordResponseDto updateMedicalRecord(Long recordId, MedicalRecordRequestDto requestDto);
    Page<MedicalRecordResponseDto> getPatientRecords(Pageable pageable);
    MedicalRecordResponseDto getMedicalRecordById(Long recordId);
    Page<MedicalRecordResponseDto> getRecordsByPatientIdForDoctor(Long patientId, Pageable pageable);
    MedicalRecordResponseDto getMedicalRecordByIdForAdmin(Long recordId);
    MedicalRecordResponseDto getRecordByAppointmentId(Long appointmentId);
    Page<MedicalRecordResponseDto> getAllRecordsForDoctor(Pageable pageable);
    Page<MedicalRecordResponseDto> getAllRecordsForAdmin(Pageable pageable);
    void deleteMedicalRecordByPatient(Long recordId);
    void deleteMedicalRecordByDoctor(Long recordId);
    void deleteMedicalRecordByAdmin(Long recordId);
}
