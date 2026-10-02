package com.example.me.hospitalmanagement.dto;

import com.example.me.hospitalmanagement.entity.type.BillStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateBillStatusDto {

    @NotNull(message = "Status is required")
    private BillStatus status;

}
