package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    List<DoctorAvailability> findByDoctorId(Long doctorId);
    List<DoctorAvailability> findByDoctorIdAndDayOfWeek(Long doctorId, DayOfWeek dayOfWeek);
    boolean existsByDoctorId(Long doctorId);
    void deleteByDoctorId(Long doctorId);
}
