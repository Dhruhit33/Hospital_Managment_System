package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.dto.BillResponseDto;
import com.example.me.hospitalmanagement.dto.PaymentResponseDto;
import com.example.me.hospitalmanagement.entity.*;
import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import com.example.me.hospitalmanagement.entity.type.BillStatus;
import com.example.me.hospitalmanagement.entity.type.PaymentMethod;
import com.example.me.hospitalmanagement.error.exception.BusinessRuleException;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.error.exception.ForbiddenOperationException;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.AppointmentRepository;
import com.example.me.hospitalmanagement.repository.BillRepository;
import com.example.me.hospitalmanagement.repository.PaymentRepository;
import com.example.me.hospitalmanagement.service.BillService;
import com.example.me.hospitalmanagement.service.BillingCalculator;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;
    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final BillingCalculator billingCalculator;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public BillResponseDto generateBill(Long appointmentId, BigDecimal medicineCharges, BigDecimal otherCharges) {
        if (billRepository.existsByAppointmentId(appointmentId)) {
            throw new DuplicateResourceException("Bill already exists for this appointment");
        }

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BusinessRuleException("Can only generate a bill for COMPLETED appointments");
        }

        BigDecimal fee = appointment.getDoctor().getConsultationFee() != null ? 
                         appointment.getDoctor().getConsultationFee() : BigDecimal.ZERO;
        
        BigDecimal total = billingCalculator.calculateTotalAmount(fee, medicineCharges, otherCharges);
        
        Insurance insurance = appointment.getPatient().getInsurance();
        BigDecimal covered = billingCalculator.calculateInsuranceCovered(total, insurance);
        
        BigDecimal payable = billingCalculator.calculatePatientPayable(total, covered);
        
        BillStatus status = payable.compareTo(BigDecimal.ZERO) == 0 ? BillStatus.PAID : BillStatus.PENDING;

        Bill bill = Bill.builder()
                .appointment(appointment)
                .consultationFee(fee)
                .medicineCharges(medicineCharges)
                .otherCharges(otherCharges)
                .insuranceCovered(covered)
                .totalAmount(total)
                .patientPayable(payable)
                .status(status)
                .build();
                
        Bill saved = billRepository.save(bill);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getPatientBills(BillStatus status, Pageable pageable) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Page<Bill> bills;
        if (status != null) {
            bills = billRepository.findByAppointment_Patient_IdAndStatus(user.getId(), status, pageable);
        } else {
            bills = billRepository.findByAppointment_Patient_Id(user.getId(), pageable);
        }
        return bills.map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponseDto getPatientBill(Long billId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
                
        if (!bill.getAppointment().getPatient().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("You can only view your own bills");
        }
        return mapToDto(bill);
    }

    @Override
    @Transactional
    public BillResponseDto payBill(Long billId, BigDecimal amount, String method, String transactionRef, String idempotencyKey) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
                
        if (!bill.getAppointment().getPatient().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("You can only pay your own bills");
        }
        
        if (bill.getStatus() == BillStatus.PAID || bill.getStatus() == BillStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot pay a bill that is already PAID or CANCELLED");
        }
        
        if (paymentRepository.existsByIdempotencyKey(idempotencyKey)) {
            // Already processed
            return mapToDto(bill);
        }

        BigDecimal totalPaid = bill.getPayments().stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        BigDecimal remaining = bill.getPatientPayable().subtract(totalPaid);
        if (amount.compareTo(remaining) > 0) {
            throw new BusinessRuleException("Payment amount exceeds outstanding balance");
        }
        
        Payment payment = Payment.builder()
                .bill(bill)
                .amount(amount)
                .method(PaymentMethod.valueOf(method))
                .transactionRef(transactionRef)
                .idempotencyKey(idempotencyKey)
                .paidAt(LocalDateTime.now())
                .build();
                
        bill.getPayments().add(payment);
        
        BigDecimal newTotalPaid = totalPaid.add(amount);
        if (newTotalPaid.compareTo(bill.getPatientPayable()) == 0) {
            bill.setStatus(BillStatus.PAID);
        } else {
            bill.setStatus(BillStatus.PARTIALLY_PAID);
        }
        
        Bill saved = billRepository.save(bill);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getBillsForAdmin(BillStatus status, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Page<Bill> bills = billRepository.findFilteredBills(status, from, to, pageable);
        return bills.map(this::mapToDto);
    }

    @Override
    @Transactional
    public BillResponseDto updateBillStatus(Long billId, BillStatus status) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        if (bill.getStatus() == status) {
            return mapToDto(bill);
        }

        bill.setStatus(status);

        // If marking as PAID by Admin and no payments exist, record admin payment
        if (status == BillStatus.PAID) {
            BigDecimal totalPaid = bill.getPayments().stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal remaining = bill.getPatientPayable().subtract(totalPaid);
            if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                Payment adminPayment = Payment.builder()
                        .bill(bill)
                        .amount(remaining)
                        .method(PaymentMethod.CASH)
                        .transactionRef("ADMIN-MANUAL-" + (System.currentTimeMillis() % 1000000))
                        .idempotencyKey(java.util.UUID.randomUUID().toString())
                        .paidAt(LocalDateTime.now())
                        .build();
                bill.getPayments().add(adminPayment);
            }
        }

        Bill saved = billRepository.save(bill);
        return mapToDto(saved);
    }

    private BillResponseDto mapToDto(Bill bill) {
        BillResponseDto dto = modelMapper.map(bill, BillResponseDto.class);
        dto.setAppointmentId(bill.getAppointment().getId());
        if (bill.getPayments() != null) {
            List<PaymentResponseDto> payments = bill.getPayments().stream()
                    .map(p -> modelMapper.map(p, PaymentResponseDto.class))
                    .collect(Collectors.toList());
            dto.setPayments(payments);
        }
        return dto;
    }
}
