package com.example.me.hospitalmanagement.dto;

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
public class DoctorAvailabilityResponseDto {

    private Long doctorId;
    private List<AvailabilitySlotDto> availabilities;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class AvailabilitySlotDto {
        private Long id;
        private DayOfWeek dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
    }
}
