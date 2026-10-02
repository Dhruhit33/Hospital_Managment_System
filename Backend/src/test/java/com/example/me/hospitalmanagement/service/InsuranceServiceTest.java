package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.InsuranceDto;
import com.example.me.hospitalmanagement.dto.PatientDto;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.InsuranceRepository;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InsuranceServiceTest {

    @Mock
    private InsuranceRepository insuranceRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private InsuranceService insuranceService;

    private Patient patient;
    private InsuranceDto insuranceDto;
    private PatientDto patientDto;

    @BeforeEach
    void setUp() {
        patient = Patient.builder().id(1L).name("Jane Doe").email("jane@test.com").build();
        insuranceDto = InsuranceDto.builder().policyNumber("POL123").provider("HDFC").validUntil(java.time.LocalDate.parse("2030-01-01")).build();
        patientDto = new PatientDto();
        patientDto.setId(1L);
        patientDto.setName("Jane Doe");
    }

    @Test
    void assignInsuranceToPatient_Success() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(patientRepository.save(any(Patient.class))).thenReturn(patient);
        when(modelMapper.map(patient, PatientDto.class)).thenReturn(patientDto);

        PatientDto result = insuranceService.assignInsuranceToPatient(insuranceDto, 1L);

        assertNotNull(result);
        assertEquals("Jane Doe", result.getName());
        verify(patientRepository, times(1)).save(patient);
    }

    @Test
    void assignInsuranceToPatient_NotFound_ThrowsException() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> insuranceService.assignInsuranceToPatient(insuranceDto, 99L));
    }
}
