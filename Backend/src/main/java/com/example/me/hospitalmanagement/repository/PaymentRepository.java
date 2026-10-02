package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    boolean existsByIdempotencyKey(String idempotencyKey);
}
