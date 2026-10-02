package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.MedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    
    Optional<MedicalRecord> findByAppointmentId(Long appointmentId);
    
    boolean existsByAppointmentId(Long appointmentId);
    
    Page<MedicalRecord> findByAppointment_Patient_Id(Long patientId, Pageable pageable);
    
    List<MedicalRecord> findByAppointment_Patient_Id(Long patientId);

    Page<MedicalRecord> findByAppointment_Doctor_User_Id(Long doctorUserId, Pageable pageable);

    List<MedicalRecord> findByAppointment_Doctor_User_Id(Long doctorUserId);
    
    @Query("SELECT mr FROM MedicalRecord mr WHERE mr.appointment.patient.id = :patientId AND mr.appointment.doctor.id = :doctorId")
    List<MedicalRecord> findByPatientIdAndDoctorId(@Param("patientId") Long patientId, @Param("doctorId") Long doctorId);
}
