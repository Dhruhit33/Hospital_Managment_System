package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DoctorRepository extends JpaRepository<Doctor, Long>, JpaSpecificationExecutor<Doctor> {
    Optional<Doctor> findByUserId(Long userId);

    Optional<Doctor> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Doctor d WHERE d.id = :id")
    Optional<Doctor> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT DISTINCT d FROM Doctor d LEFT JOIN FETCH d.departments")
    java.util.List<Doctor> findAllWithDepartments();
}