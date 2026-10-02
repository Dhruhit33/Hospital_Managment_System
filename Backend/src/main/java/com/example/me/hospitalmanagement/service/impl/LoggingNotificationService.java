package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.entity.Appointment;
import com.example.me.hospitalmanagement.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@ConditionalOnProperty(name = "notification.mode", havingValue = "log", matchIfMissing = true)
@Slf4j
public class LoggingNotificationService implements NotificationService {

    @Override
    public void sendAppointmentBooked(Appointment appointment) {
        String patientName = appointment.getPatient() != null ? appointment.getPatient().getName() : "Patient";
        String patientEmail = appointment.getPatient() != null ? appointment.getPatient().getEmail() : "N/A";
        String doctorName = appointment.getDoctor() != null ? appointment.getDoctor().getName() : "Doctor";
        String doctorEmail = appointment.getDoctor() != null ? appointment.getDoctor().getEmail() : "N/A";
        String timeStr = appointment.getAppointmentTime() != null ? appointment.getAppointmentTime().toString() : "N/A";
        String reason = appointment.getReason() != null ? appointment.getReason() : "General Consultation";

        log.info("==================== EMAIL DISPATCH (BOOKING) ====================");
        log.info("[1. EMAIL TO DOCTOR: {} <{}>] Subject: 'New Appointment Booking - Patient {} (CarePoint)'",
                doctorName, doctorEmail, patientName);
        log.info("Content: Patient {} scheduled an appointment for {} (Chief Complaint: '{}'). Awaiting your confirmation.",
                patientName, timeStr, reason);
        log.info("------------------------------------------------------------------");
        log.info("[2. EMAIL TO PATIENT: {} <{}>] Subject: 'Appointment Request Received - CarePoint Hospital'",
                patientName, patientEmail);
        log.info("Content: Your appointment request with Dr. {} for {} has been received (Status: BOOKED). Pending doctor confirmation.",
                doctorName, timeStr);
        log.info("==================================================================");
    }

    @Override
    public void sendAppointmentConfirmed(Appointment appointment) {
        String patientName = appointment.getPatient() != null ? appointment.getPatient().getName() : "Patient";
        String patientEmail = appointment.getPatient() != null ? appointment.getPatient().getEmail() : "N/A";
        String doctorName = appointment.getDoctor() != null ? appointment.getDoctor().getName() : "Doctor";
        String doctorEmail = appointment.getDoctor() != null ? appointment.getDoctor().getEmail() : "N/A";
        String timeStr = appointment.getAppointmentTime() != null ? appointment.getAppointmentTime().toString() : "N/A";

        log.info("==================== EMAIL DISPATCH (CONFIRMATION) ====================");
        log.info("[EMAIL TO PATIENT: {} <{}>] Subject: 'Appointment Confirmed - Dr. {} - CarePoint Hospital'",
                patientName, patientEmail, doctorName);
        log.info("Content: Great news! Your appointment with Dr. {} on {} has been CONFIRMED by the doctor.",
                doctorName, timeStr);
        log.info("[AUDIT RECORD FOR DOCTOR: {} <{}>] Appointment #{} for patient {} is confirmed.",
                doctorName, doctorEmail, appointment.getId(), patientName);
        log.info("=======================================================================");
    }

    @Override
    public void sendAppointmentCancelled(Appointment appointment) {
        String patientName = appointment.getPatient() != null ? appointment.getPatient().getName() : "Patient";
        String patientEmail = appointment.getPatient() != null ? appointment.getPatient().getEmail() : "N/A";
        String doctorName = appointment.getDoctor() != null ? appointment.getDoctor().getName() : "Doctor";
        String doctorEmail = appointment.getDoctor() != null ? appointment.getDoctor().getEmail() : "N/A";

        log.info("[NOTIFICATION: CANCELLED] Appointment #{} cancelled. Notified Patient {} ({}) and Doctor {} ({}). Reason: {}",
                appointment.getId(), patientName, patientEmail, doctorName, doctorEmail, appointment.getCancelReason());
    }

    @Override
    public void sendAppointmentRescheduled(Appointment appointment, LocalDateTime oldTime) {
        String patientName = appointment.getPatient() != null ? appointment.getPatient().getName() : "Patient";
        String patientEmail = appointment.getPatient() != null ? appointment.getPatient().getEmail() : "N/A";
        String doctorName = appointment.getDoctor() != null ? appointment.getDoctor().getName() : "Doctor";

        log.info("[NOTIFICATION: RESCHEDULED] Appointment #{} for Patient {} ({}) with Dr. {} rescheduled from {} to {}",
                appointment.getId(), patientName, patientEmail, doctorName, oldTime, appointment.getAppointmentTime());
    }

    @Override
    public void sendAppointmentReminder(Appointment appointment) {
        String patientName = appointment.getPatient() != null ? appointment.getPatient().getName() : "Patient";
        String patientEmail = appointment.getPatient() != null ? appointment.getPatient().getEmail() : "N/A";
        String doctorName = appointment.getDoctor() != null ? appointment.getDoctor().getName() : "Doctor";

        log.info("[NOTIFICATION: REMINDER] Reminder for upcoming Appointment #{} sent to Patient {} ({}) with Dr. {} on {}",
                appointment.getId(), patientName, patientEmail, doctorName, appointment.getAppointmentTime());
    }
}
