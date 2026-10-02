package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.AppointmentResponseDto;
import com.example.me.hospitalmanagement.dto.CreateAppointmentDto;
import com.example.me.hospitalmanagement.entity.Appointment;
import com.example.me.hospitalmanagement.entity.Doctor;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import com.example.me.hospitalmanagement.event.AppointmentBookedEvent;
import com.example.me.hospitalmanagement.repository.AppointmentRepository;
import com.example.me.hospitalmanagement.repository.DoctorRepository;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import com.example.me.hospitalmanagement.service.impl.AppointmentReminderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentNotificationTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private SlotService slotService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ApplicationEventPublisher applicationEventPublisher;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private AppointmentService appointmentService;

    private User patientUser;
    private Doctor doctor;
    private Patient patient;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        patientUser = User.builder().id(10L).username("patient@hospital.com").build();
        doctor = Doctor.builder().id(20L).name("Dr. House").email("house@hospital.com").build();
        patient = Patient.builder().id(10L).name("Gregory").user(patientUser).build();

        appointment = Appointment.builder()
                .id(100L)
                .doctor(doctor)
                .patient(patient)
                .appointmentTime(LocalDateTime.now().plusDays(2))
                .status(AppointmentStatus.BOOKED)
                .reminderSent(false)
                .build();
    }

    @Test
    void createNewAppointment_PublishesAppointmentBookedEvent() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(patientUser);
        SecurityContextHolder.setContext(securityContext);

        CreateAppointmentDto dto = CreateAppointmentDto.builder()
                .doctorId(20L)
                .appointmentTime(LocalDateTime.now().plusDays(2))
                .reason("Checkup")
                .build();

        when(doctorRepository.findByIdWithLock(20L)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(slotService.isSlotAvailable(anyLong(), any())).thenReturn(true);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
        when(modelMapper.map(any(), eq(AppointmentResponseDto.class))).thenReturn(new AppointmentResponseDto());

        appointmentService.createNewAppointment(dto);

        // Verify that event was published for after-commit notification handling
        verify(applicationEventPublisher).publishEvent(any(AppointmentBookedEvent.class));
    }

    @Test
    void cancelAppointment_CallsSendAppointmentCancelled() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(patientUser);
        SecurityContextHolder.setContext(securityContext);

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
        when(modelMapper.map(any(), eq(AppointmentResponseDto.class))).thenReturn(new AppointmentResponseDto());

        appointmentService.cancelAppointment(100L, "Cannot make it");

        verify(notificationService).sendAppointmentCancelled(appointment);
    }

    @Test
    void rescheduleAppointment_CallsSendAppointmentRescheduledWithOldTime() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(patientUser);
        SecurityContextHolder.setContext(securityContext);

        LocalDateTime oldTime = appointment.getAppointmentTime();
        LocalDateTime newTime = oldTime.plusDays(1);

        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(slotService.isSlotAvailable(20L, newTime)).thenReturn(true);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
        when(modelMapper.map(any(), eq(AppointmentResponseDto.class))).thenReturn(new AppointmentResponseDto());

        appointmentService.rescheduleAppointment(100L, newTime);

        verify(notificationService).sendAppointmentRescheduled(appointment, oldTime);
    }

    @Test
    void appointmentReminderService_SendsRemindersAndMarksSent() {
        AppointmentRepository reminderRepo = mock(AppointmentRepository.class);
        NotificationService reminderNotif = mock(NotificationService.class);
        AppointmentReminderService reminderService = new AppointmentReminderService(reminderRepo, reminderNotif);

        when(reminderRepo.findByStatusInAndAppointmentTimeBetweenAndReminderSentFalse(any(), any(), any()))
                .thenReturn(List.of(appointment));

        reminderService.sendUpcomingReminders();

        verify(reminderNotif).sendAppointmentReminder(appointment);
        assertTrue(appointment.isReminderSent());
        verify(reminderRepo).saveAll(List.of(appointment));
    }
}
