package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.entity.Appointment;

import java.time.LocalDateTime;

public interface NotificationService {

    void sendAppointmentBooked(Appointment appointment);

    void sendAppointmentCancelled(Appointment appointment);

    void sendAppointmentRescheduled(Appointment appointment, LocalDateTime oldTime);

    void sendAppointmentReminder(Appointment appointment);

    void sendAppointmentConfirmed(Appointment appointment);
}
