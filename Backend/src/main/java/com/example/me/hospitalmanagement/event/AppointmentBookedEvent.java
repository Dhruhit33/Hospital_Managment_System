package com.example.me.hospitalmanagement.event;

import com.example.me.hospitalmanagement.entity.Appointment;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AppointmentBookedEvent {
    private final Appointment appointment;
}
