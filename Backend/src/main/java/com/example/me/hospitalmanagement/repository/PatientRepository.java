package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.dto.BloodGroupCountResponse;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.type.BloodGroup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long>, JpaSpecificationExecutor<Patient> {

    Optional<Patient> findByEmail(String email);

    Patient findByName(String name);

    List<Patient> findByBirthDateOrEmail(LocalDate birthDate, String email);

    List<Patient> findByBirthDateBetween(LocalDate startDate, LocalDate endDate);

    List<Patient> findByNameContainingOrderByIdDesc(String query);

    @Query("SELECT p FROM Patient p WHERE p.bloodGroup = ?1")
    List<Patient> findByBloodGroup(BloodGroup bloodGroup);

    @Query("SELECT p FROM Patient p WHERE p.birthDate > :birthDate")
    List<Patient> findByBornAfterDate(@Param("birthDate") LocalDate birthDate);

    @Query(value = "SELECT * FROM patient", nativeQuery = true)
    Page<Patient> findAllPatients(Pageable pageable);

    @Transactional
    @Modifying
    @Query("UPDATE Patient p SET p.name = :name WHERE p.id = :id")
    int updateNameWithId(@Param("name") String name, @Param("id") Long id);

    @Query("SELECT p FROM Patient p LEFT JOIN FETCH p.appointments")
    List<Patient> findAllPatientWithAppointment();
    
    @Query("SELECT new com.example.me.hospitalmanagement.dto.BloodGroupCountResponse(p.bloodGroup, COUNT(p)) FROM Patient p WHERE p.bloodGroup IS NOT NULL GROUP BY p.bloodGroup")
    List<BloodGroupCountResponse> countByBloodGroup();
}