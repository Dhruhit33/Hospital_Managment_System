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
import com.example.me.hospitalmanagement.repository.BillRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import com.example.me.hospitalmanagement.error.exception.BusinessRuleException;
import com.example.me.hospitalmanagement.error.exception.ForbiddenOperationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final BillRepository billRepository;
    private final ModelMapper modelMapper;
    private final SlotService slotService;
    private final NotificationService notificationService;
    private final org.springframework.context.ApplicationEventPublisher applicationEventPublisher;
    private final org.springframework.cache.CacheManager cacheManager;

    @Value("${appointment.cancel-window-hours:2}")
    private int cancelWindowHours;

    private void evictSlotCache(Long doctorId, java.time.LocalDate date) {
        if (doctorId != null && date != null && cacheManager != null) {
            org.springframework.cache.Cache cache = cacheManager.getCache("slots");
            if (cache != null) {
                cache.evict(doctorId + "-" + date);
            }
        }
    }

    @Transactional
    @PreAuthorize("hasAuthority('appointment:write') or #doctorId == authentication.principal.id")
    public AppointmentResponseDto reAssignAppointment(Long appointmentId, Long doctorId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        appointment.setDoctor(doctor);
        Appointment savedAppointment = appointmentRepository.save(appointment);
        return mapToResponseDto(savedAppointment);
    }

    public AppointmentResponseDto mapToResponseDto(Appointment appointment) {
        AppointmentResponseDto dto = modelMapper.map(appointment, AppointmentResponseDto.class);
        if (billRepository != null) {
            billRepository.findByAppointmentId(appointment.getId()).ifPresent(bill -> {
                dto.setBillId(bill.getId());
                dto.setBillStatus(bill.getStatus().name());
                dto.setBillTotal(bill.getTotalAmount());
                dto.setPatientPayable(bill.getPatientPayable());
            });
        }
        return dto;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<AppointmentResponseDto> getAllAppointments() {
        return appointmentRepository.findAllByOrderByAppointmentTimeDesc()
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN') or (hasRole('DOCTOR') and #doctorId == authentication.principal.id)")
    public List<AppointmentResponseDto> getAllAppointmentOfDoctor(Long doctorId) {
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        return appointmentRepository.findByDoctorIdOrderByAppointmentTimeDesc(doctorId)
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @PreAuthorize("hasRole('PATIENT') or hasRole('ADMIN')")
    public List<AppointmentResponseDto> getAllAppointmentsOfPatient(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentTimeDesc(patientId)
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('PATIENT')")
    public AppointmentResponseDto createNewAppointment(CreateAppointmentDto createAppointmentDto) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Long doctorId = createAppointmentDto.getDoctorId();
        Doctor doctor = doctorRepository.findByIdWithLock(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
        Patient patient = patientRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found for user id: " + user.getId()));

        if (!slotService.isSlotAvailable(doctorId, createAppointmentDto.getAppointmentTime())) {
            throw new BusinessRuleException("Slot is not available for booking.");
        }

        // Cross-check: Ensure doctor does not already have an appointment with another patient at this time
        if (appointmentRepository.existsByDoctorIdAndAppointmentTimeAndStatusIn(
                doctorId,
                createAppointmentDto.getAppointmentTime(),
                List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED))) {
            throw new BusinessRuleException("This doctor already has an appointment booked with another patient at this time.");
        }

        // Cross-check: Ensure this patient does not already have another appointment at this time
        if (appointmentRepository.existsByPatientIdAndAppointmentTimeAndStatusIn(
                patient.getId(),
                createAppointmentDto.getAppointmentTime(),
                List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED))) {
            throw new BusinessRuleException("You already have an appointment scheduled at this time. Please select a different slot.");
        }

        Appointment appointment = Appointment.builder()
                .reason(createAppointmentDto.getReason())
                .appointmentTime(createAppointmentDto.getAppointmentTime())
                .status(AppointmentStatus.BOOKED)
                .build();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        patient.getAppointments().add(appointment);

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Evict slot cache for this doctor & date
        evictSlotCache(doctor.getId(), savedAppointment.getAppointmentTime().toLocalDate());

        // Publish event for transactional post-commit notification
        applicationEventPublisher.publishEvent(new com.example.me.hospitalmanagement.event.AppointmentBookedEvent(savedAppointment));

        return modelMapper.map(savedAppointment, AppointmentResponseDto.class);
    }

    @Transactional
    @PreAuthorize("hasRole('PATIENT') or hasRole('DOCTOR') or hasRole('ADMIN')")
    public AppointmentResponseDto cancelAppointment(Long appointmentId, String cancelReason) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        boolean isPatient = user.getRoles().stream().anyMatch(r -> r.name().equals("PATIENT"));
        if (isPatient && !appointment.getPatient().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("Cannot cancel someone else's appointment");
        }

        boolean isDoctor = user.getRoles().stream().anyMatch(r -> r.name().equals("DOCTOR"));
        if (isDoctor && !appointment.getDoctor().getUser().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("Cannot cancel another doctor's appointment");
        }

        if (isPatient) {
            LocalDateTime cutoffTime = appointment.getAppointmentTime().minusHours(cancelWindowHours);
            if (LocalDateTime.now().isAfter(cutoffTime)) {
                throw new BusinessRuleException("Cannot cancel appointment within " + cancelWindowHours + " hours of the appointment time.");
            }
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessRuleException("Appointment is already cancelled.");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessRuleException("Cannot cancel a completed appointment.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledBy(user.getId());
        appointment.setCancelReason(cancelReason);
        appointment.setCancelledAt(LocalDateTime.now());

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Evict slot cache
        evictSlotCache(savedAppointment.getDoctor().getId(), savedAppointment.getAppointmentTime().toLocalDate());

        // Send cancelled notification
        notificationService.sendAppointmentCancelled(savedAppointment);

        return modelMapper.map(savedAppointment, AppointmentResponseDto.class);
    }

    @Transactional
    @PreAuthorize("hasRole('PATIENT')")
    public AppointmentResponseDto rescheduleAppointment(Long appointmentId, LocalDateTime newTime) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        if (!appointment.getPatient().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("Cannot reschedule someone else's appointment");
        }

        LocalDateTime cutoffTime = appointment.getAppointmentTime().minusHours(cancelWindowHours);
        if (LocalDateTime.now().isAfter(cutoffTime)) {
            throw new BusinessRuleException("Cannot reschedule appointment within " + cancelWindowHours + " hours of the appointment time.");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessRuleException("Cannot reschedule a cancelled or completed appointment.");
        }

        if (!slotService.isSlotAvailable(appointment.getDoctor().getId(), newTime)) {
            throw new BusinessRuleException("New slot is not available for booking.");
        }

        // Cross-check: Ensure doctor does not already have an appointment with another patient at new time
        if (appointmentRepository.existsByDoctorIdAndAppointmentTimeAndStatusIn(
                appointment.getDoctor().getId(),
                newTime,
                List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED))) {
            throw new BusinessRuleException("The doctor is already booked for this new time slot.");
        }

        // Cross-check: Ensure patient does not already have an appointment at new time
        if (appointmentRepository.existsByPatientIdAndAppointmentTimeAndStatusIn(
                appointment.getPatient().getId(),
                newTime,
                List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED))) {
            throw new BusinessRuleException("You already have an appointment booked for this new time slot.");
        }

        LocalDateTime oldTime = appointment.getAppointmentTime();

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledBy(user.getId());
        appointment.setCancelReason("Rescheduled");
        appointment.setCancelledAt(LocalDateTime.now());
        appointmentRepository.save(appointment);

        Appointment newAppointment = Appointment.builder()
                .reason(appointment.getReason())
                .appointmentTime(newTime)
                .status(AppointmentStatus.BOOKED)
                .build();
        newAppointment.setDoctor(appointment.getDoctor());
        newAppointment.setPatient(appointment.getPatient());
        
        Appointment savedAppointment = appointmentRepository.save(newAppointment);

        // Evict both old date and new date from slot cache
        evictSlotCache(appointment.getDoctor().getId(), oldTime.toLocalDate());
        evictSlotCache(savedAppointment.getDoctor().getId(), savedAppointment.getAppointmentTime().toLocalDate());

        // Send rescheduled notification
        notificationService.sendAppointmentRescheduled(savedAppointment, oldTime);

        return modelMapper.map(savedAppointment, AppointmentResponseDto.class);
    }

    @Transactional
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public AppointmentResponseDto updateAppointmentStatus(Long appointmentId, AppointmentStatus newStatus) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        boolean isDoctor = user.getRoles().stream().anyMatch(r -> r.name().equals("DOCTOR"));
        if (isDoctor && !appointment.getDoctor().getUser().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("Cannot update another doctor's appointment status");
        }

        // Validate transitions
        AppointmentStatus currentStatus = appointment.getStatus();
        if (currentStatus == newStatus) {
            return modelMapper.map(appointment, AppointmentResponseDto.class);
        }

        if (currentStatus == AppointmentStatus.CANCELLED || currentStatus == AppointmentStatus.COMPLETED) {
            throw new BusinessRuleException("Cannot update status of a " + currentStatus.name() + " appointment.");
        }
        
        if (currentStatus == AppointmentStatus.BOOKED && newStatus != AppointmentStatus.CONFIRMED && newStatus != AppointmentStatus.CANCELLED) {
            throw new BusinessRuleException("Invalid status transition from BOOKED to " + newStatus.name());
        }

        if (currentStatus == AppointmentStatus.CONFIRMED && newStatus != AppointmentStatus.COMPLETED && newStatus != AppointmentStatus.NO_SHOW && newStatus != AppointmentStatus.CANCELLED) {
            throw new BusinessRuleException("Invalid status transition from CONFIRMED to " + newStatus.name());
        }

        appointment.setStatus(newStatus);
        if (newStatus == AppointmentStatus.CANCELLED) {
            appointment.setCancelledBy(user.getId());
            if (appointment.getCancelledAt() == null) {
                appointment.setCancelledAt(LocalDateTime.now());
            }
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Evict slot cache
        evictSlotCache(savedAppointment.getDoctor().getId(), savedAppointment.getAppointmentTime().toLocalDate());

        // Send confirmation email to patient when doctor confirms appointment
        if (newStatus == AppointmentStatus.CONFIRMED) {
            notificationService.sendAppointmentConfirmed(savedAppointment);
        }

        return modelMapper.map(savedAppointment, AppointmentResponseDto.class);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('PATIENT')")
    public void deleteAppointment(Long appointmentId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.name().equals("ADMIN"));
        boolean isDoctor = user.getRoles().stream().anyMatch(r -> r.name().equals("DOCTOR"));
        boolean isPatient = user.getRoles().stream().anyMatch(r -> r.name().equals("PATIENT"));

        if (!isAdmin) {
            if (isDoctor && (appointment.getDoctor() == null || appointment.getDoctor().getUser() == null || !appointment.getDoctor().getUser().getId().equals(user.getId()))) {
                throw new ForbiddenOperationException("Cannot delete another doctor's appointment");
            }
            if (isPatient && (appointment.getPatient() == null || !appointment.getPatient().getId().equals(user.getId()))) {
                throw new ForbiddenOperationException("Cannot delete someone else's appointment");
            }
        }

        // Non-admins can only delete cancelled appointments
        if (!isAdmin && appointment.getStatus() != AppointmentStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot delete an active appointment. It must be CANCELLED first.");
        }

        if (appointment.getDoctor() != null) {
            evictSlotCache(appointment.getDoctor().getId(), appointment.getAppointmentTime().toLocalDate());
        }

        if (appointment.getPatient() != null && appointment.getPatient().getAppointments() != null) {
            appointment.getPatient().getAppointments().remove(appointment);
        }

        appointmentRepository.delete(appointment);
    }

    @Transactional
    public int cleanupCancelledAppointments(LocalDateTime cutoffTime) {
        List<Appointment> oldCancelled = appointmentRepository.findCancelledAppointmentsOlderThan(cutoffTime);
        if (oldCancelled.isEmpty()) {
            return 0;
        }

        for (Appointment apt : oldCancelled) {
            if (apt.getDoctor() != null) {
                evictSlotCache(apt.getDoctor().getId(), apt.getAppointmentTime().toLocalDate());
            }
            if (apt.getPatient() != null && apt.getPatient().getAppointments() != null) {
                apt.getPatient().getAppointments().remove(apt);
            }
        }

        appointmentRepository.deleteAll(oldCancelled);
        return oldCancelled.size();
    }

    @Transactional
    public int cleanupCompletedSettledAppointments(LocalDateTime cutoffTime) {
        List<Appointment> candidates = appointmentRepository.findCompletedAppointmentsOlderThan(cutoffTime);
        if (candidates.isEmpty()) {
            return 0;
        }

        List<Appointment> toDelete = new ArrayList<>();
        for (Appointment apt : candidates) {
            if (billRepository != null) {
                var billOpt = billRepository.findByAppointmentId(apt.getId());
                // If bill exists and is PAID, or patient payable is 0
                if (billOpt.isPresent()) {
                    var bill = billOpt.get();
                    if (bill.getStatus() == com.example.me.hospitalmanagement.entity.type.BillStatus.PAID
                            || (bill.getPatientPayable() != null && bill.getPatientPayable().compareTo(java.math.BigDecimal.ZERO) == 0)) {
                        toDelete.add(apt);
                    }
                }
            }
        }

        if (toDelete.isEmpty()) {
            return 0;
        }

        for (Appointment apt : toDelete) {
            if (apt.getDoctor() != null) {
                evictSlotCache(apt.getDoctor().getId(), apt.getAppointmentTime().toLocalDate());
            }
            if (apt.getPatient() != null && apt.getPatient().getAppointments() != null) {
                apt.getPatient().getAppointments().remove(apt);
            }
        }

        appointmentRepository.deleteAll(toDelete);
        return toDelete.size();
    }
}
