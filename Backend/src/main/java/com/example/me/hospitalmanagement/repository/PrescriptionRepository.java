package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
}
