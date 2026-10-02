package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.Appointment;
import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByDoctorIdAndAppointmentTimeAndStatusIn(Long doctorId, LocalDateTime appointmentTime, List<AppointmentStatus> statuses);

    boolean existsByPatientIdAndAppointmentTimeAndStatusIn(Long patientId, LocalDateTime appointmentTime, List<AppointmentStatus> statuses);

    List<Appointment> findByDoctorIdAndAppointmentTimeBetweenAndStatusIn(Long doctorId, LocalDateTime start, LocalDateTime end, List<AppointmentStatus> statuses);

    List<Appointment> findByPatientIdAndAppointmentTimeBetweenAndStatusIn(Long patientId, LocalDateTime start, LocalDateTime end, List<AppointmentStatus> statuses);

    List<Appointment> findByPatientIdOrderByAppointmentTimeDesc(Long patientId);

    List<Appointment> findByDoctorIdOrderByAppointmentTimeDesc(Long doctorId);

    List<Appointment> findAllByOrderByAppointmentTimeDesc();

    boolean existsByDoctorIdAndPatientId(Long doctorId, Long patientId);

    List<Appointment> findByStatusInAndAppointmentTimeBetweenAndReminderSentFalse(List<AppointmentStatus> statuses, LocalDateTime start, LocalDateTime end);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentTime >= :startOfDay AND a.appointmentTime < :endOfDay")
    Long countAppointmentsToday(@org.springframework.data.repository.query.Param("startOfDay") LocalDateTime startOfDay, @org.springframework.data.repository.query.Param("endOfDay") LocalDateTime endOfDay);
    
    @org.springframework.data.jpa.repository.Query("SELECT a.status, COUNT(a) FROM Appointment a GROUP BY a.status")
    List<Object[]> countAppointmentsByStatus();
    
    @org.springframework.data.jpa.repository.Query("SELECT d.name, COUNT(a) FROM Appointment a JOIN a.doctor d GROUP BY d.id, d.name ORDER BY COUNT(a) DESC")
    List<Object[]> countAppointmentsPerDoctor(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Appointment a WHERE a.status = com.example.me.hospitalmanagement.entity.type.AppointmentStatus.CANCELLED AND (a.cancelledAt <= :cutoffTime OR (a.cancelledAt IS NULL AND a.updatedAt <= :cutoffTime))")
    List<Appointment> findCancelledAppointmentsOlderThan(@org.springframework.data.repository.query.Param("cutoffTime") LocalDateTime cutoffTime);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Appointment a WHERE a.status = com.example.me.hospitalmanagement.entity.type.AppointmentStatus.COMPLETED AND (a.updatedAt <= :cutoffTime OR a.appointmentTime <= :cutoffTime)")
    List<Appointment> findCompletedAppointmentsOlderThan(@org.springframework.data.repository.query.Param("cutoffTime") LocalDateTime cutoffTime);
}