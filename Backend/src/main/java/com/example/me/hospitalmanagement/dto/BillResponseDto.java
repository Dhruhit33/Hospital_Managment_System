package com.example.me.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponseDto {
    private Long id;
    private Long appointmentId;
    private BigDecimal consultationFee;
    private BigDecimal medicineCharges;
    private BigDecimal otherCharges;
    private BigDecimal insuranceCovered;
    private BigDecimal totalAmount;
    private BigDecimal patientPayable;
    private String status;
    private LocalDateTime createdAt;
    private List<PaymentResponseDto> payments;
}
