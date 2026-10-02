package com.example.me.hospitalmanagement.dto;

import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateAppointmentStatusDto {

    @NotNull(message = "Status is required")
    private AppointmentStatus status;

}
