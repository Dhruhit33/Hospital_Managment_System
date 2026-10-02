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
public class CancelledAppointmentCleanupService {

    private final AppointmentService appointmentService;

    @Value("${appointment.cancelled-retention-hours:24}")
    private int retentionHours;

    /**
     * Periodically runs to automatically purge cancelled appointments that have passed
     * the retention threshold (default: 24 hours / 1 day after cancellation).
     * Runs every 15 minutes, with an initial 30-second delay upon startup.
     */
    @Scheduled(fixedRate = 900000, initialDelay = 30000)
    public void cleanupExpiredCancelledAppointments() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(retentionHours);
        log.debug("Checking for cancelled appointments older than {} (retention: {} hours)", cutoffTime, retentionHours);
        try {
            int deletedCount = appointmentService.cleanupCancelledAppointments(cutoffTime);
            if (deletedCount > 0) {
                log.info("Auto-deleted {} cancelled appointment(s) older than {} hours (1 day retention)", deletedCount, retentionHours);
            }
        } catch (Exception e) {
            log.error("Failed to clean up expired cancelled appointments: {}", e.getMessage(), e);
        }
    }
}
