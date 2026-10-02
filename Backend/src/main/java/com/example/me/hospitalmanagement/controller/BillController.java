package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.BillGenerateRequestDto;
import com.example.me.hospitalmanagement.dto.BillResponseDto;
import com.example.me.hospitalmanagement.dto.PaymentRequestDto;
import com.example.me.hospitalmanagement.entity.type.BillStatus;
import com.example.me.hospitalmanagement.service.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;

    @PostMapping("/admin/bills/generate/{appointmentId}")
    @PreAuthorize("hasRole('ADMIN') and hasAuthority('bill:write')")
    public ResponseEntity<BillResponseDto> generateBill(
            @PathVariable Long appointmentId,
            @Valid @RequestBody BillGenerateRequestDto requestDto) {
        return new ResponseEntity<>(billService.generateBill(appointmentId, requestDto.getMedicineCharges(), requestDto.getOtherCharges()), HttpStatus.CREATED);
    }

    @GetMapping("/patient/bills")
    @PreAuthorize("hasRole('PATIENT') and hasAuthority('bill:read')")
    public ResponseEntity<Page<BillResponseDto>> getPatientBills(
            @RequestParam(required = false) BillStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(billService.getPatientBills(status, pageable));
    }

    @GetMapping("/patient/bills/{id}")
    @PreAuthorize("hasRole('PATIENT') and hasAuthority('bill:read')")
    public ResponseEntity<BillResponseDto> getPatientBill(@PathVariable Long id) {
        return ResponseEntity.ok(billService.getPatientBill(id));
    }

    @PostMapping("/patient/bills/{id}/pay")
    @PreAuthorize("hasRole('PATIENT') and hasAuthority('bill:write')")
    public ResponseEntity<BillResponseDto> payBill(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequestDto requestDto) {
        return ResponseEntity.ok(billService.payBill(id, requestDto.getAmount(), requestDto.getMethod().name(), requestDto.getTransactionRef(), requestDto.getIdempotencyKey()));
    }

    @GetMapping("/admin/bills")
    @PreAuthorize("hasRole('ADMIN') and hasAuthority('bill:read')")
    public ResponseEntity<Page<BillResponseDto>> getBillsForAdmin(
            @RequestParam(required = false) BillStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(billService.getBillsForAdmin(status, from, to, pageable));
    }

    @PatchMapping("/admin/bills/{id}/status")
    @PreAuthorize("hasRole('ADMIN') and hasAuthority('bill:write')")
    public ResponseEntity<BillResponseDto> updateBillStatus(
            @PathVariable Long id,
            @Valid @RequestBody com.example.me.hospitalmanagement.dto.UpdateBillStatusDto requestDto) {
        return ResponseEntity.ok(billService.updateBillStatus(id, requestDto.getStatus()));
    }
}
