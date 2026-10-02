package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DoctorLeaveRequestDto {

    @NotNull(message = "Leave date is required")
    @FutureOrPresent(message = "Leave date cannot be in the past")
    private LocalDate leaveDate;

    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;
}
