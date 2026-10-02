package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CancelAppointmentDto {

    @Size(max = 300, message = "Cancel reason must not exceed 300 characters")
    private String reason;
}
