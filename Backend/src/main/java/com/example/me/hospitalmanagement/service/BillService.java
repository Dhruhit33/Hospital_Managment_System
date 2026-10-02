package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.BillResponseDto;
import com.example.me.hospitalmanagement.entity.type.BillStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface BillService {
    BillResponseDto generateBill(Long appointmentId, BigDecimal medicineCharges, BigDecimal otherCharges);
    Page<BillResponseDto> getPatientBills(BillStatus status, Pageable pageable);
    BillResponseDto getPatientBill(Long billId);
    BillResponseDto payBill(Long billId, BigDecimal amount, String method, String transactionRef, String idempotencyKey);
    Page<BillResponseDto> getBillsForAdmin(BillStatus status, LocalDateTime from, LocalDateTime to, Pageable pageable);
    BillResponseDto updateBillStatus(Long billId, BillStatus status);
}
