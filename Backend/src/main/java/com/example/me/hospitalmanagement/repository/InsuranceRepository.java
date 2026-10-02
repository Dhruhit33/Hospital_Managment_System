package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.Insurance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsuranceRepository extends JpaRepository<Insurance, Long> {

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Insurance i SET i.status = :newStatus WHERE i.status = :oldStatus AND i.validUntil < :currentDate")
    int updateExpiredInsurances(@org.springframework.data.repository.query.Param("newStatus") com.example.me.hospitalmanagement.entity.type.InsuranceStatus newStatus,
                                @org.springframework.data.repository.query.Param("oldStatus") com.example.me.hospitalmanagement.entity.type.InsuranceStatus oldStatus,
                                @org.springframework.data.repository.query.Param("currentDate") java.time.LocalDate currentDate);
}