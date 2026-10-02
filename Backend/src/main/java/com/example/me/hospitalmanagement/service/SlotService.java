package com.example.me.hospitalmanagement.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface SlotService {
    com.example.me.hospitalmanagement.dto.SlotResponseDto getAvailableSlots(Long doctorId, LocalDate date);
    boolean isSlotAvailable(Long doctorId, LocalDateTime appointmentTime);
}
