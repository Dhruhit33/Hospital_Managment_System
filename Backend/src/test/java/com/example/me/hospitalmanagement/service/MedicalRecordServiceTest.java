package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.MedicalRecordRequestDto;
import com.example.me.hospitalmanagement.dto.MedicalRecordResponseDto;
import com.example.me.hospitalmanagement.entity.*;
import com.example.me.hospitalmanagement.error.exception.ForbiddenOperationException;
import com.example.me.hospitalmanagement.repository.AppointmentRepository;
import com.example.me.hospitalmanagement.repository.MedicalRecordRepository;
import com.example.me.hospitalmanagement.service.impl.MedicalRecordServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedicalRecordServiceTest {

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private com.example.me.hospitalmanagement.repository.DoctorRepository doctorRepository;

    @Mock
    private com.example.me.hospitalmanagement.repository.PatientRepository patientRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private MedicalRecordServiceImpl medicalRecordService;

    private User patientUser1;
    private User patientUser2;
    private User doctorUser;
    
    private Patient patient1;
    private Patient patient2;
    private Doctor doctor;

    private Appointment appointment1;
    private MedicalRecord medicalRecord1;

    @BeforeEach
    void setUp() {
        patientUser1 = User.builder().id(1L).build();
        patientUser2 = User.builder().id(2L).build();
        doctorUser = User.builder().id(3L).build();

        patient1 = Patient.builder().id(1L).user(patientUser1).build();
        patient2 = Patient.builder().id(2L).user(patientUser2).build();
        doctor = Doctor.builder().id(3L).user(doctorUser).build();

        appointment1 = Appointment.builder()
                .id(1L)
                .patient(patient1)
                .doctor(doctor)
                .build();

        medicalRecord1 = MedicalRecord.builder()
                .id(1L)
                .appointment(appointment1)
                .build();
    }

    @Test
    void getMedicalRecordById_PatientViewingOwnRecord_Success() {
        setSecurityContext(patientUser1);
        when(medicalRecordRepository.findById(1L)).thenReturn(Optional.of(medicalRecord1));
        when(modelMapper.map(any(), eq(MedicalRecordResponseDto.class))).thenReturn(new MedicalRecordResponseDto());

        MedicalRecordResponseDto result = medicalRecordService.getMedicalRecordById(1L);

        assertNotNull(result);
        verify(auditService, times(1)).logAction(eq(1L), eq("READ"), eq("MedicalRecord"), eq(1L));
    }

    @Test
    void getMedicalRecordById_PatientViewingOtherPatientRecord_ThrowsForbidden() {
        setSecurityContext(patientUser2);
        when(medicalRecordRepository.findById(1L)).thenReturn(Optional.of(medicalRecord1));

        assertThrows(ForbiddenOperationException.class, () -> medicalRecordService.getMedicalRecordById(1L));
    }

    @Test
    void getRecordsByPatientIdForDoctor_DoctorHasTreatedPatient_Success() {
        setSecurityContext(doctorUser);
        when(medicalRecordRepository.findByAppointment_Patient_Id(1L)).thenReturn(List.of(medicalRecord1));
        when(medicalRecordRepository.findByAppointment_Patient_Id(eq(1L), any())).thenReturn(org.springframework.data.domain.Page.empty());
        
        org.springframework.data.domain.Page<MedicalRecordResponseDto> result = medicalRecordService.getRecordsByPatientIdForDoctor(1L, org.springframework.data.domain.PageRequest.of(0, 10));
        assertNotNull(result);
    }

    @Test
    void getRecordsByPatientIdForDoctor_DoctorHasNotTreatedPatient_ThrowsForbidden() {
        setSecurityContext(doctorUser);
        when(medicalRecordRepository.findByAppointment_Patient_Id(2L)).thenReturn(List.of());
        when(appointmentRepository.existsByDoctorIdAndPatientId(3L, 2L)).thenReturn(false);
        
        assertThrows(ForbiddenOperationException.class, () -> medicalRecordService.getRecordsByPatientIdForDoctor(2L, org.springframework.data.domain.PageRequest.of(0, 10)));
    }

    private void setSecurityContext(User user) {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(user);
        SecurityContextHolder.setContext(securityContext);
    }
}
