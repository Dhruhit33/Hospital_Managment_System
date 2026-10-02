package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompletedAppointmentCleanupService {

    private final AppointmentService appointmentService;

    @Value("${appointment.completed-retention-days:7}")
    private int retentionDays;

    /**
     * Periodically runs to automatically purge completed appointments whose billing/invoice
     * process has been fully settled and paid, and which have passed the retention threshold.
     * Default: 7 days after completion & settlement.
     * Runs every 15 minutes, with an initial 45-second delay.
     */
    @Scheduled(fixedRate = 900000, initialDelay = 45000)
    public void cleanupCompletedAndSettledAppointments() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(retentionDays);
        log.debug("Checking for completed & settled appointments older than {} (retention: {} days)", cutoffTime, retentionDays);
        try {
            int deletedCount = appointmentService.cleanupCompletedSettledAppointments(cutoffTime);
            if (deletedCount > 0) {
                log.info("Auto-deleted {} completed & settled appointment(s) older than {} day(s) (all billing processes cleared)", deletedCount, retentionDays);
            }
        } catch (Exception e) {
            log.error("Failed to clean up completed & settled appointments: {}", e.getMessage(), e);
        }
    }
}
