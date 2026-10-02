package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.entity.Appointment;
import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import com.example.me.hospitalmanagement.repository.AppointmentRepository;
import com.example.me.hospitalmanagement.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderService {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 900000) // 15 minutes = 900,000 ms
    @Transactional
    public void sendUpcomingReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.plusHours(23).plusMinutes(45);
        LocalDateTime windowEnd = now.plusHours(24).plusMinutes(15);

        List<Appointment> upcomingAppointments = appointmentRepository.findByStatusInAndAppointmentTimeBetweenAndReminderSentFalse(
                List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED),
                windowStart,
                windowEnd
        );

        if (!upcomingAppointments.isEmpty()) {
            log.info("Found {} appointments needing 24-hour reminders", upcomingAppointments.size());
            for (Appointment appointment : upcomingAppointments) {
                notificationService.sendAppointmentReminder(appointment);
                appointment.setReminderSent(true);
            }
            appointmentRepository.saveAll(upcomingAppointments);
        }
    }
}
