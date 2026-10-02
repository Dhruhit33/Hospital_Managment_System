package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.PatientDto;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface PatientService {

    org.springframework.data.domain.Page<PatientDto> searchPatients(String name, String bloodGroup, java.time.LocalDate bornAfter, org.springframework.data.domain.Pageable pageable);
    PatientDto getPatientId(Long id);
    PatientDto addPatient(PatientDto patientDto);
    PatientDto getPatientProfile(Long userId);
    PatientDto updatePatientProfile(Long userId, com.example.me.hospitalmanagement.dto.UpdatePatientProfileDto dto);
}

