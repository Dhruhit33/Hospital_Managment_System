package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.Bill;
import com.example.me.hospitalmanagement.entity.type.BillStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface BillRepository extends JpaRepository<Bill, Long> {
    
    boolean existsByAppointmentId(Long appointmentId);
    
    java.util.Optional<Bill> findByAppointmentId(Long appointmentId);
    
    Page<Bill> findByAppointment_Patient_Id(Long patientId, Pageable pageable);
    
    Page<Bill> findByAppointment_Patient_IdAndStatus(Long patientId, BillStatus status, Pageable pageable);
    
    @Query("SELECT b FROM Bill b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:from IS NULL OR b.createdAt >= :from) AND " +
           "(:to IS NULL OR b.createdAt <= :to)")
    Page<Bill> findFilteredBills(@Param("status") BillStatus status, 
                                 @Param("from") LocalDateTime from, 
                                 @Param("to") LocalDateTime to, 
                                 Pageable pageable);
                                 
    @Query("SELECT SUM(b.totalAmount) FROM Bill b WHERE b.createdAt >= :startOfMonth AND b.status IN ('PAID', 'PARTIALLY_PAID')")
    java.math.BigDecimal sumRevenueThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth);
    
    Long countByStatus(BillStatus status);
}
