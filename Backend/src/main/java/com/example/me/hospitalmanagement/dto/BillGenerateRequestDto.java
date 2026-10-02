package com.example.me.hospitalmanagement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillGenerateRequestDto {
    @NotNull
    @PositiveOrZero
    private BigDecimal medicineCharges;

    @NotNull
    @PositiveOrZero
    private BigDecimal otherCharges;
}
