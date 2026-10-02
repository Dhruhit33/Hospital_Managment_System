package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DoctorAvailabilityRequestDto {

    @NotNull(message = "Availabilities list is required")
    private List<AvailabilitySlotDto> availabilities;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class AvailabilitySlotDto {
        @NotNull(message = "Day of week is required")
        private DayOfWeek dayOfWeek;

        @NotNull(message = "Start time is required")
        private LocalTime startTime;

        @NotNull(message = "End time is required")
        private LocalTime endTime;
    }
}
