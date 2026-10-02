package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.AppointmentResponseDto;
import com.example.me.hospitalmanagement.dto.CreateAppointmentDto;
import com.example.me.hospitalmanagement.entity.Appointment;
import com.example.me.hospitalmanagement.entity.Doctor;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.AppointmentRepository;
import com.example.me.hospitalmanagement.repository.DoctorRepository;
import com.example.me.hospitalmanagement.repository.PatientRepository;
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

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private com.example.me.hospitalmanagement.repository.BillRepository billRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private SlotService slotService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private org.springframework.context.ApplicationEventPublisher applicationEventPublisher;

    @Mock
    private org.springframework.cache.CacheManager cacheManager;

    @InjectMocks
    private AppointmentService appointmentService;

    private User patientUser;
    private Doctor doctor;
    private Patient patient;
    private Appointment appointment;
    private CreateAppointmentDto createAppointmentDto;

    @BeforeEach
    void setUp() {
        patientUser = User.builder().id(1L).username("patient@test.com").build();
        doctor = Doctor.builder().id(2L).name("Dr. Smith").email("smith@test.com").build();
        patient = Patient.builder().id(1L).name("John Doe").user(patientUser).build();

        appointment = Appointment.builder()
                .id(10L)
                .doctor(doctor)
                .patient(patient)
                .reason("Checkup")
                .appointmentTime(LocalDateTime.now().plusDays(1))
                .build();

        createAppointmentDto = CreateAppointmentDto.builder()
                .doctorId(2L)
                .appointmentTime(LocalDateTime.now().plusDays(1))
                .reason("Checkup")
                .build();
    }

    @Test
    void createNewAppointment_Success() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(patientUser);
        SecurityContextHolder.setContext(securityContext);

        when(doctorRepository.findByIdWithLock(2L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(slotService.isSlotAvailable(anyLong(), any())).thenReturn(true);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
        when(modelMapper.map(any(), eq(AppointmentResponseDto.class))).thenReturn(new AppointmentResponseDto());

        AppointmentResponseDto result = appointmentService.createNewAppointment(createAppointmentDto);

        assertNotNull(result);
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    void createNewAppointment_DoctorNotFound_ThrowsException() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(patientUser);
        SecurityContextHolder.setContext(securityContext);

        when(doctorRepository.findByIdWithLock(2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> appointmentService.createNewAppointment(createAppointmentDto));
    }

    @Test
    void deleteAppointment_CancelledAppointment_DeletesSuccessfully() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        User doctorUser = User.builder().id(2L).username("smith@test.com").roles(java.util.Set.of(com.example.me.hospitalmanagement.entity.type.RoleType.DOCTOR)).build();
        doctor.setUser(doctorUser);
        when(authentication.getPrincipal()).thenReturn(doctorUser);
        SecurityContextHolder.setContext(securityContext);

        appointment.setStatus(com.example.me.hospitalmanagement.entity.type.AppointmentStatus.CANCELLED);
        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));

        appointmentService.deleteAppointment(10L);

        verify(appointmentRepository, times(1)).delete(appointment);
    }

    @Test
    void deleteAppointment_ActiveAppointmentByNonAdmin_ThrowsBusinessRuleException() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        User doctorUser = User.builder().id(2L).username("smith@test.com").roles(java.util.Set.of(com.example.me.hospitalmanagement.entity.type.RoleType.DOCTOR)).build();
        doctor.setUser(doctorUser);
        when(authentication.getPrincipal()).thenReturn(doctorUser);
        SecurityContextHolder.setContext(securityContext);

        appointment.setStatus(com.example.me.hospitalmanagement.entity.type.AppointmentStatus.BOOKED);
        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));

        assertThrows(com.example.me.hospitalmanagement.error.exception.BusinessRuleException.class,
                () -> appointmentService.deleteAppointment(10L));
        verify(appointmentRepository, never()).delete(any());
    }

    @Test
    void cleanupCancelledAppointments_DeletesOlderCancelled() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        appointment.setStatus(com.example.me.hospitalmanagement.entity.type.AppointmentStatus.CANCELLED);
        when(appointmentRepository.findCancelledAppointmentsOlderThan(any())).thenReturn(java.util.List.of(appointment));

        int count = appointmentService.cleanupCancelledAppointments(cutoff);

        assertEquals(1, count);
        verify(appointmentRepository, times(1)).deleteAll(any());
    }
}
