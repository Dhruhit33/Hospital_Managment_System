package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.dto.SlotResponseDto;
import com.example.me.hospitalmanagement.entity.Appointment;
import com.example.me.hospitalmanagement.entity.DoctorAvailability;
import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.AppointmentRepository;
import com.example.me.hospitalmanagement.repository.DoctorAvailabilityRepository;
import com.example.me.hospitalmanagement.repository.DoctorLeaveRepository;
import com.example.me.hospitalmanagement.repository.DoctorRepository;
import com.example.me.hospitalmanagement.service.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.Doctor;
import com.example.me.hospitalmanagement.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.DayOfWeek;

@Service
@RequiredArgsConstructor
public class SlotServiceImpl implements SlotService {

    private final DoctorAvailabilityRepository availabilityRepository;
    private final DoctorLeaveRepository leaveRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof User u) {
            return u;
        } else if (principal instanceof UserDetails ud) {
            return userRepository.findByUsername(ud.getUsername()).orElse(null);
        } else if (principal instanceof String username) {
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }

    private List<DoctorAvailability> getEffectiveAvailabilities(Long doctorId, DayOfWeek dayOfWeek) {
        List<DoctorAvailability> availabilities = availabilityRepository.findByDoctorIdAndDayOfWeek(doctorId, dayOfWeek);
        if (availabilities != null && !availabilities.isEmpty()) {
            return availabilities;
        }

        // If the doctor has not configured custom shifts, provide standard hospital clinic consulting hours:
        // Monday through Saturday (and Sunday), 09:00 to 17:00, 30-minute intervals
        boolean hasAnyCustom = availabilityRepository.existsByDoctorId(doctorId);
        if (!hasAnyCustom) {
            Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
            if (doctor != null) {
                return List.of(
                        DoctorAvailability.builder()
                                .doctor(doctor)
                                .dayOfWeek(dayOfWeek)
                                .startTime(LocalTime.of(9, 0))
                                .endTime(LocalTime.of(17, 0))
                                .slotDurationMinutes(30)
                                .build()
                );
            }
        }

        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public SlotResponseDto getAvailableSlots(Long doctorId, LocalDate date) {
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        if (date.isBefore(LocalDate.now())) {
            return SlotResponseDto.builder()
                    .doctorId(doctorId)
                    .date(date)
                    .availableSlots(List.of())
                    .build();
        }

        if (leaveRepository.existsByDoctorIdAndLeaveDate(doctorId, date)) {
            return SlotResponseDto.builder()
                    .doctorId(doctorId)
                    .date(date)
                    .availableSlots(List.of())
                    .build();
        }

        List<DoctorAvailability> availabilities = getEffectiveAvailabilities(doctorId, date.getDayOfWeek());
        if (availabilities.isEmpty()) {
            return SlotResponseDto.builder()
                    .doctorId(doctorId)
                    .date(date)
                    .availableSlots(List.of())
                    .build();
        }

        // Cross-check: 1. Doctor's existing booked appointments for this date
        List<Appointment> existingAppointments = appointmentRepository.findByDoctorIdAndAppointmentTimeBetweenAndStatusIn(
                doctorId,
                date.atStartOfDay(),
                date.atTime(LocalTime.MAX),
                List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED)
        );

        List<LocalTime> bookedTimes = new ArrayList<>(existingAppointments.stream()
                .map(Appointment::getAppointmentTime)
                .map(LocalDateTime::toLocalTime)
                .toList());

        // Cross-check: 2. Current patient's appointments on this date (prevent patient scheduling duplicate consultations)
        User currentUser = getCurrentUser();
        if (currentUser != null) {
            List<Appointment> patientAppointments = appointmentRepository.findByPatientIdAndAppointmentTimeBetweenAndStatusIn(
                    currentUser.getId(),
                    date.atStartOfDay(),
                    date.atTime(LocalTime.MAX),
                    List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED)
            );
            for (Appointment pApt : patientAppointments) {
                bookedTimes.add(pApt.getAppointmentTime().toLocalTime());
            }
        }

        List<LocalTime> availableSlots = new ArrayList<>();
        for (DoctorAvailability availability : availabilities) {
            int duration = (availability.getSlotDurationMinutes() != null && availability.getSlotDurationMinutes() > 0)
                    ? availability.getSlotDurationMinutes()
                    : 30;
            LocalTime slotTime = availability.getStartTime();
            while (slotTime.isBefore(availability.getEndTime()) || slotTime.equals(availability.getEndTime())) {
                if (slotTime.plusMinutes(duration).isAfter(availability.getEndTime())) {
                    break;
                }
                
                // Cross-check: only add slot if neither the doctor nor the patient is booked
                if (!bookedTimes.contains(slotTime)) {
                    // Filter out past slots for today
                    if (date.isEqual(LocalDate.now()) && slotTime.isBefore(LocalTime.now().plusMinutes(5))) {
                        slotTime = slotTime.plusMinutes(duration);
                        continue;
                    }
                    availableSlots.add(slotTime);
                }
                slotTime = slotTime.plusMinutes(duration);
            }
        }

        List<LocalTime> distinctSortedSlots = availableSlots.stream().distinct().sorted().toList();

        return SlotResponseDto.builder()
                .doctorId(doctorId)
                .date(date)
                .availableSlots(distinctSortedSlots)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSlotAvailable(Long doctorId, LocalDateTime appointmentTime) {
        LocalDate date = appointmentTime.toLocalDate();
        LocalTime time = appointmentTime.toLocalTime();

        if (date.isBefore(LocalDate.now()) || (date.isEqual(LocalDate.now()) && time.isBefore(LocalTime.now()))) {
            return false;
        }

        if (leaveRepository.existsByDoctorIdAndLeaveDate(doctorId, date)) {
            return false;
        }

        List<DoctorAvailability> availabilities = getEffectiveAvailabilities(doctorId, date.getDayOfWeek());
        
        boolean slotValid = false;
        for (DoctorAvailability availability : availabilities) {
            int duration = (availability.getSlotDurationMinutes() != null && availability.getSlotDurationMinutes() > 0)
                    ? availability.getSlotDurationMinutes()
                    : 30;
            LocalTime slotTime = availability.getStartTime();
            while (slotTime.isBefore(availability.getEndTime()) || slotTime.equals(availability.getEndTime())) {
                if (slotTime.plusMinutes(duration).isAfter(availability.getEndTime())) {
                    break;
                }
                if (slotTime.equals(time)) {
                    slotValid = true;
                    break;
                }
                slotTime = slotTime.plusMinutes(duration);
            }
            if (slotValid) break;
        }

        if (!slotValid) {
            return false;
        }

        // Cross-check: Ensure doctor has no existing appointment at this exact time
        return !appointmentRepository.existsByDoctorIdAndAppointmentTimeAndStatusIn(
                doctorId,
                appointmentTime,
                List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED)
        );
    }
}
