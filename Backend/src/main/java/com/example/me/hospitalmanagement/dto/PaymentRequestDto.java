package com.example.me.hospitalmanagement.dto;

import com.example.me.hospitalmanagement.entity.type.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDto {
    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private PaymentMethod method;

    private String transactionRef;

    @NotBlank
    private String idempotencyKey;
}
