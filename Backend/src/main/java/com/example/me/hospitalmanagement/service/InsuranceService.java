package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.InsuranceDto;
import com.example.me.hospitalmanagement.dto.PatientDto;
import com.example.me.hospitalmanagement.entity.Insurance;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.InsuranceRepository;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InsuranceService {

    private final InsuranceRepository insuranceRepository;
    private final PatientRepository patientRepository;
    private final ModelMapper modelMapper;

    @Transactional
    public PatientDto assignInsuranceToPatient(InsuranceDto insuranceDto, Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        Insurance insurance = Insurance.builder()
                .policyNumber(insuranceDto.getPolicyNumber())
                .provider(insuranceDto.getProvider())
                .validUntil(insuranceDto.getValidUntil())
                .coveragePercent(insuranceDto.getCoveragePercent() != null ? insuranceDto.getCoveragePercent() : 70)
                .build();

        patient.setInsurance(insurance);
        insurance.setPatient(patient);

        Patient savedPatient = patientRepository.save(patient);
        return modelMapper.map(savedPatient, PatientDto.class);
    }

    @Transactional
    public PatientDto dissaccociateInsurance(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        patient.setInsurance(null);
        Patient savedPatient = patientRepository.save(patient);
        return modelMapper.map(savedPatient, PatientDto.class);
    }

    @Transactional(readOnly = true)
    public InsuranceDto getInsuranceByPatientId(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        
        if (patient.getInsurance() == null) {
            throw new ResourceNotFoundException("Insurance not found for this patient");
        }
        return modelMapper.map(patient.getInsurance(), InsuranceDto.class);
    }
}
