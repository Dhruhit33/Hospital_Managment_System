package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.entity.Appointment;
import com.example.me.hospitalmanagement.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@ConditionalOnProperty(name = "notification.mode", havingValue = "email")
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService implements NotificationService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${notification.mail-from:noreply@hospital.com}")
    private String mailFrom;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' hh:mm a");

    @Async("notificationTaskExecutor")
    @Override
    public void sendAppointmentBooked(Appointment appointment) {
        String patientName = getPatientName(appointment);
        String doctorName = getDoctorName(appointment);
        String doctorSpecialization = getDoctorSpecialization(appointment);
        String formattedTime = formatTime(appointment.getAppointmentTime());
        String reason = getReason(appointment);

        // 1. Notify Doctor via Email
        String doctorEmail = getDoctorEmail(appointment);
        String doctorSubject = String.format("New Appointment Booking - Patient %s (CarePoint)", patientName);
        String doctorBody = String.format(
                "Dear Dr. %s,\n\n" +
                "A new appointment has been booked with you by patient %s.\n\n" +
                "Booking Details:\n" +
                "• Patient Name: %s\n" +
                "• Scheduled Date & Time: %s\n" +
                "• Reason / Chief Complaint: %s\n" +
                "• Status: BOOKED (Awaiting Your Confirmation)\n\n" +
                "Please log in to your CarePoint Doctor Portal under 'Patient Appointments' to confirm or manage this consultation.\n\n" +
                "Best regards,\n" +
                "CarePoint Hospital Operations",
                doctorName,
                patientName,
                patientName,
                formattedTime,
                reason
        );
        sendEmail(doctorEmail, doctorSubject, doctorBody);

        // 2. Notify Patient via Email (Receipt & Status acknowledgement)
        String patientEmail = getPatientEmail(appointment);
        String patientSubject = "Appointment Booking Request Received - CarePoint Hospital";
        String patientBody = String.format(
                "Dear %s,\n\n" +
                "Your appointment request with Dr. %s has been successfully submitted.\n\n" +
                "Consultation Details:\n" +
                "• Consulting Doctor: Dr. %s (%s)\n" +
                "• Scheduled Date & Time: %s\n" +
                "• Reason: %s\n" +
                "• Status: BOOKED (Awaiting Doctor Confirmation)\n\n" +
                "Dr. %s has received an email notification to review and confirm your slot. You will receive an immediate confirmation email once the doctor confirms your visit.\n\n" +
                "Thank you for choosing CarePoint Hospital.\n\n" +
                "Warm regards,\n" +
                "CarePoint Hospital Management",
                patientName,
                doctorName,
                doctorName,
                doctorSpecialization,
                formattedTime,
                reason,
                doctorName
        );
        sendEmail(patientEmail, patientSubject, patientBody);
    }

    @Async("notificationTaskExecutor")
    @Override
    public void sendAppointmentConfirmed(Appointment appointment) {
        String patientName = getPatientName(appointment);
        String doctorName = getDoctorName(appointment);
        String doctorSpecialization = getDoctorSpecialization(appointment);
        String formattedTime = formatTime(appointment.getAppointmentTime());
        String reason = getReason(appointment);

        // Notify Patient: Consultation confirmed by doctor
        String patientEmail = getPatientEmail(appointment);
        String patientSubject = String.format("Appointment Confirmed - Dr. %s - CarePoint Hospital", doctorName);
        String patientBody = String.format(
                "Dear %s,\n\n" +
                "Great news! Your upcoming consultation with Dr. %s has been CONFIRMED by the doctor.\n\n" +
                "Confirmed Consultation Details:\n" +
                "• Doctor: Dr. %s (%s)\n" +
                "• Confirmed Date & Time: %s\n" +
                "• Chief Complaint / Reason: %s\n" +
                "• Status: CONFIRMED\n\n" +
                "Please arrive at the clinic 10 minutes prior to your scheduled consultation time. You can view your visit records and invoice status anytime in your Patient Portal.\n\n" +
                "Warm regards,\n" +
                "CarePoint Hospital Management",
                patientName,
                doctorName,
                doctorName,
                doctorSpecialization,
                formattedTime,
                reason
        );
        sendEmail(patientEmail, patientSubject, patientBody);
    }

    @Async("notificationTaskExecutor")
    @Override
    public void sendAppointmentCancelled(Appointment appointment) {
        String patientName = getPatientName(appointment);
        String doctorName = getDoctorName(appointment);
        String formattedTime = formatTime(appointment.getAppointmentTime());
        String cancelReason = appointment.getCancelReason() != null ? appointment.getCancelReason() : "Cancelled by request";

        // Patient notification
        String patientEmail = getPatientEmail(appointment);
        sendEmail(
                patientEmail,
                "Appointment Cancellation - CarePoint Hospital",
                String.format(
                        "Dear %s,\n\nYour appointment with Dr. %s scheduled for %s has been cancelled.\nReason: %s\n\nCarePoint Hospital Management",
                        patientName, doctorName, formattedTime, cancelReason
                )
        );

        // Doctor notification
        String doctorEmail = getDoctorEmail(appointment);
        sendEmail(
                doctorEmail,
                String.format("Appointment Cancelled - Patient %s", patientName),
                String.format(
                        "Dear Dr. %s,\n\nThe appointment scheduled with patient %s on %s has been cancelled.\nReason: %s\n\nCarePoint Hospital Management",
                        doctorName, patientName, formattedTime, cancelReason
                )
        );
    }

    @Async("notificationTaskExecutor")
    @Override
    public void sendAppointmentRescheduled(Appointment appointment, LocalDateTime oldTime) {
        String patientName = getPatientName(appointment);
        String doctorName = getDoctorName(appointment);
        String oldTimeStr = formatTime(oldTime);
        String newTimeStr = formatTime(appointment.getAppointmentTime());

        // Patient notification
        String patientEmail = getPatientEmail(appointment);
        sendEmail(
                patientEmail,
                "Appointment Rescheduled - CarePoint Hospital",
                String.format(
                        "Dear %s,\n\nYour appointment with Dr. %s has been rescheduled from %s to %s.\n\nCarePoint Hospital Management",
                        patientName, doctorName, oldTimeStr, newTimeStr
                )
        );

        // Doctor notification
        String doctorEmail = getDoctorEmail(appointment);
        sendEmail(
                doctorEmail,
                String.format("Appointment Rescheduled - Patient %s", patientName),
                String.format(
                        "Dear Dr. %s,\n\nYour consultation with patient %s has been rescheduled from %s to %s.\n\nCarePoint Hospital Management",
                        doctorName, patientName, oldTimeStr, newTimeStr
                )
        );
    }

    @Async("notificationTaskExecutor")
    @Override
    public void sendAppointmentReminder(Appointment appointment) {
        String patientName = getPatientName(appointment);
        String doctorName = getDoctorName(appointment);
        String formattedTime = formatTime(appointment.getAppointmentTime());

        String patientEmail = getPatientEmail(appointment);
        sendEmail(
                patientEmail,
                "Appointment Reminder - CarePoint Hospital",
                String.format(
                        "Dear %s,\n\nThis is a friendly reminder that you have an upcoming consultation with Dr. %s tomorrow, %s.\n\nCarePoint Hospital Management",
                        patientName, doctorName, formattedTime
                )
        );
    }

    private void sendEmail(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Cannot send email: recipient address is null or empty. Subject: '{}'", subject);
            return;
        }

        if (mailSender == null) {
            log.info("[EMAIL NOTIFICATION SIMULATION] MailSender not available. Recipient: {}\nSubject: {}\nContent:\n{}",
                    toEmail, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Successfully dispatched email to [{}] - Subject: '{}'", toEmail, subject);
        } catch (Exception e) {
            log.warn("Could not dispatch real SMTP email to [{}] ({}). Logged notification preview:\nSubject: {}\n{}",
                    toEmail, e.getMessage(), subject, body);
        }
    }

    private String getDoctorEmail(Appointment appointment) {
        if (appointment == null || appointment.getDoctor() == null) return null;
        if (appointment.getDoctor().getEmail() != null && !appointment.getDoctor().getEmail().isBlank()) {
            return appointment.getDoctor().getEmail();
        }
        if (appointment.getDoctor().getUser() != null) {
            return appointment.getDoctor().getUser().getUsername();
        }
        return null;
    }

    private String getPatientEmail(Appointment appointment) {
        if (appointment == null || appointment.getPatient() == null) return null;
        if (appointment.getPatient().getEmail() != null && !appointment.getPatient().getEmail().isBlank()) {
            return appointment.getPatient().getEmail();
        }
        if (appointment.getPatient().getUser() != null) {
            return appointment.getPatient().getUser().getUsername();
        }
        return null;
    }

    private String getDoctorName(Appointment appointment) {
        return appointment != null && appointment.getDoctor() != null && appointment.getDoctor().getName() != null
                ? appointment.getDoctor().getName() : "Doctor";
    }

    private String getPatientName(Appointment appointment) {
        return appointment != null && appointment.getPatient() != null && appointment.getPatient().getName() != null
                ? appointment.getPatient().getName() : "Patient";
    }

    private String getDoctorSpecialization(Appointment appointment) {
        return appointment != null && appointment.getDoctor() != null && appointment.getDoctor().getSpecialization() != null
                ? appointment.getDoctor().getSpecialization() : "General Practice";
    }

    private String getReason(Appointment appointment) {
        return appointment != null && appointment.getReason() != null && !appointment.getReason().isBlank()
                ? appointment.getReason() : "General Consultation";
    }

    private String formatTime(LocalDateTime time) {
        return time != null ? time.format(FORMATTER) : "Scheduled Time";
    }
}
