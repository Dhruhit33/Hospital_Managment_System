package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.entity.Insurance;
import com.example.me.hospitalmanagement.entity.type.InsuranceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BillingCalculatorTest {

    private BillingCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new BillingCalculator();
    }

    @Test
    void calculateTotalAmount() {
        BigDecimal fee = new BigDecimal("500.00");
        BigDecimal medicine = new BigDecimal("150.50");
        BigDecimal other = new BigDecimal("50.00");

        BigDecimal total = calculator.calculateTotalAmount(fee, medicine, other);
        assertEquals(new BigDecimal("700.50"), total);
    }

    @Test
    void calculateInsuranceCovered_NoInsurance() {
        BigDecimal total = new BigDecimal("1000.00");
        BigDecimal covered = calculator.calculateInsuranceCovered(total, null);
        assertEquals(new BigDecimal("0.00"), covered);
    }

    @Test
    void calculateInsuranceCovered_ExpiredInsuranceByStatus() {
        BigDecimal total = new BigDecimal("1000.00");
        Insurance insurance = Insurance.builder().status(InsuranceStatus.EXPIRED).validUntil(LocalDate.now().plusDays(10)).build();
        BigDecimal covered = calculator.calculateInsuranceCovered(total, insurance);
        assertEquals(new BigDecimal("0.00"), covered);
    }

    @Test
    void calculateInsuranceCovered_ExpiredInsuranceByDate() {
        BigDecimal total = new BigDecimal("1000.00");
        Insurance insurance = Insurance.builder().status(InsuranceStatus.ACTIVE).validUntil(LocalDate.now().minusDays(1)).build();
        BigDecimal covered = calculator.calculateInsuranceCovered(total, insurance);
        assertEquals(new BigDecimal("0.00"), covered);
    }

    @Test
    void calculateInsuranceCovered_ActiveInsurance70Percent() {
        BigDecimal total = new BigDecimal("1000.00");
        Insurance insurance = Insurance.builder().status(InsuranceStatus.ACTIVE).validUntil(LocalDate.now().plusDays(10)).coveragePercent(70).build();
        BigDecimal covered = calculator.calculateInsuranceCovered(total, insurance);
        assertEquals(new BigDecimal("700.00"), covered);
    }

    @Test
    void calculateInsuranceCovered_ActiveInsurance100Percent() {
        BigDecimal total = new BigDecimal("1000.00");
        Insurance insurance = Insurance.builder().status(InsuranceStatus.ACTIVE).validUntil(LocalDate.now().plusDays(10)).coveragePercent(100).build();
        BigDecimal covered = calculator.calculateInsuranceCovered(total, insurance);
        assertEquals(new BigDecimal("1000.00"), covered);
    }

    @Test
    void calculateInsuranceCovered_Rounding() {
        BigDecimal total = new BigDecimal("333.33");
        Insurance insurance = Insurance.builder().status(InsuranceStatus.ACTIVE).validUntil(LocalDate.now().plusDays(10)).coveragePercent(70).build();
        BigDecimal covered = calculator.calculateInsuranceCovered(total, insurance);
        assertEquals(new BigDecimal("233.33"), covered); // 333.33 * 0.70 = 233.331 -> 233.33
    }

    @Test
    void calculatePatientPayable() {
        BigDecimal total = new BigDecimal("1000.00");
        BigDecimal covered = new BigDecimal("700.00");
        BigDecimal payable = calculator.calculatePatientPayable(total, covered);
        assertEquals(new BigDecimal("300.00"), payable);
    }

    @Test
    void calculatePatientPayable_OverpaymentOrNegative() {
        BigDecimal total = new BigDecimal("500.00");
        BigDecimal covered = new BigDecimal("600.00"); // E.g., if logic is weird
        BigDecimal payable = calculator.calculatePatientPayable(total, covered);
        assertEquals(new BigDecimal("0.00"), payable);
    }
}
