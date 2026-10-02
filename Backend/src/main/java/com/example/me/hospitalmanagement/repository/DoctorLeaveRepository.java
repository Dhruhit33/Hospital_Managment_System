package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.DoctorLeave;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DoctorLeaveRepository extends JpaRepository<DoctorLeave, Long> {
    List<DoctorLeave> findByDoctorIdAndLeaveDateBetween(Long doctorId, LocalDate startDate, LocalDate endDate);
    boolean existsByDoctorIdAndLeaveDate(Long doctorId, LocalDate leaveDate);
}
