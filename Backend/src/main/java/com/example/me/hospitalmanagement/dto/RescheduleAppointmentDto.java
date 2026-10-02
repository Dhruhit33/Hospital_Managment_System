package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RescheduleAppointmentDto {

    @NotNull(message = "New appointment time is required")
    @Future(message = "New appointment time must be in the future")
    private LocalDateTime newAppointmentTime;
}
