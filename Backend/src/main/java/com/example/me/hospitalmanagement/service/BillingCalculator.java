package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.entity.Insurance;
import com.example.me.hospitalmanagement.entity.type.InsuranceStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Component
public class BillingCalculator {

    public BigDecimal calculateTotalAmount(BigDecimal consultationFee, BigDecimal medicineCharges, BigDecimal otherCharges) {
        BigDecimal total = BigDecimal.ZERO;
        if (consultationFee != null) total = total.add(consultationFee);
        if (medicineCharges != null) total = total.add(medicineCharges);
        if (otherCharges != null) total = total.add(otherCharges);
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateInsuranceCovered(BigDecimal totalAmount, Insurance insurance) {
        if (insurance == null || insurance.getStatus() == InsuranceStatus.EXPIRED) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (insurance.getValidUntil() != null && insurance.getValidUntil().isBefore(LocalDate.now())) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        Integer coverage = insurance.getCoveragePercent();
        if (coverage == null || coverage <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (coverage > 100) {
            coverage = 100;
        }

        BigDecimal coverageDecimal = BigDecimal.valueOf(coverage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return totalAmount.multiply(coverageDecimal).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculatePatientPayable(BigDecimal totalAmount, BigDecimal insuranceCovered) {
        BigDecimal payable = totalAmount.subtract(insuranceCovered);
        return payable.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : payable.setScale(2, RoundingMode.HALF_UP);
    }
}
