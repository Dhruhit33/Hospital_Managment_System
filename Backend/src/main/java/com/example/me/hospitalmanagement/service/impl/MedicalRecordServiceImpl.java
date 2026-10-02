package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.dto.MedicalRecordRequestDto;
import com.example.me.hospitalmanagement.dto.MedicalRecordResponseDto;
import com.example.me.hospitalmanagement.entity.Appointment;
import com.example.me.hospitalmanagement.entity.MedicalRecord;
import com.example.me.hospitalmanagement.entity.Prescription;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.type.AppointmentStatus;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.error.exception.ForbiddenOperationException;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.AppointmentRepository;
import com.example.me.hospitalmanagement.repository.MedicalRecordRepository;
import com.example.me.hospitalmanagement.service.AuditService;
import com.example.me.hospitalmanagement.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final com.example.me.hospitalmanagement.repository.DoctorRepository doctorRepository;
    private final com.example.me.hospitalmanagement.repository.PatientRepository patientRepository;
    private final AuditService auditService;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public MedicalRecordResponseDto createMedicalRecord(Long appointmentId, MedicalRecordRequestDto requestDto) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getDoctor().getUser().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("You can only create records for your own appointments");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.NO_SHOW) {
            throw new ForbiddenOperationException("Cannot create a medical record for a " + appointment.getStatus() + " appointment");
        }

        // Auto-complete the appointment upon filing EHR if currently BOOKED or CONFIRMED
        if (appointment.getStatus() == AppointmentStatus.BOOKED || appointment.getStatus() == AppointmentStatus.CONFIRMED) {
            appointment.setStatus(AppointmentStatus.COMPLETED);
            appointmentRepository.save(appointment);
        }

        if (medicalRecordRepository.existsByAppointmentId(appointmentId)) {
            MedicalRecord existing = medicalRecordRepository.findByAppointmentId(appointmentId).orElse(null);
            if (existing != null) {
                return updateMedicalRecord(existing.getId(), requestDto);
            }
        }

        MedicalRecord record = MedicalRecord.builder()
                .appointment(appointment)
                .diagnosis(requestDto.getDiagnosis())
                .notes(requestDto.getNotes())
                .followUpDate(requestDto.getFollowUpDate())
                .attachmentName(requestDto.getAttachmentName())
                .attachmentType(requestDto.getAttachmentType())
                .attachmentSize(requestDto.getAttachmentSize())
                .attachmentData(requestDto.getAttachmentData())
                .build();

        if (requestDto.getPrescriptions() != null) {
            List<Prescription> prescriptions = requestDto.getPrescriptions().stream()
                    .map(pDto -> Prescription.builder()
                            .medicalRecord(record)
                            .medicineName(pDto.getMedicineName())
                            .dosage(pDto.getDosage())
                            .frequency(pDto.getFrequency())
                            .durationDays(pDto.getDurationDays())
                            .instructions(pDto.getInstructions())
                            .build())
                    .collect(Collectors.toList());
            record.setPrescriptions(prescriptions);
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        auditService.logAction(user.getId(), "CREATE", "MedicalRecord", saved.getId());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public MedicalRecordResponseDto createOrUpdateRecordForPatient(Long patientId, MedicalRecordRequestDto requestDto) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        com.example.me.hospitalmanagement.entity.Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        com.example.me.hospitalmanagement.entity.Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID " + patientId));

        // Find existing appointments between this doctor and patient
        List<Appointment> doctorApts = appointmentRepository.findByDoctorIdOrderByAppointmentTimeDesc(doctor.getId())
                .stream()
                .filter(a -> a.getPatient() != null && a.getPatient().getId().equals(patientId))
                .collect(Collectors.toList());

        Appointment targetApt = null;
        for (Appointment apt : doctorApts) {
            if (!medicalRecordRepository.existsByAppointmentId(apt.getId())) {
                targetApt = apt;
                break;
            }
        }

        // If all appointments already have a record or none exists, create a completed clinical consultation appointment
        if (targetApt == null) {
            targetApt = appointmentRepository.save(Appointment.builder()
                    .doctor(doctor)
                    .patient(patient)
                    .appointmentTime(java.time.LocalDateTime.now())
                    .status(AppointmentStatus.COMPLETED)
                    .reason(requestDto.getDiagnosis() != null ? requestDto.getDiagnosis() : "Clinical Consultation & EHR")
                    .build());
        } else if (targetApt.getStatus() == AppointmentStatus.BOOKED || targetApt.getStatus() == AppointmentStatus.CONFIRMED) {
            targetApt.setStatus(AppointmentStatus.COMPLETED);
            appointmentRepository.save(targetApt);
        }

        MedicalRecord record = MedicalRecord.builder()
                .appointment(targetApt)
                .diagnosis(requestDto.getDiagnosis())
                .notes(requestDto.getNotes())
                .followUpDate(requestDto.getFollowUpDate())
                .attachmentName(requestDto.getAttachmentName())
                .attachmentType(requestDto.getAttachmentType())
                .attachmentSize(requestDto.getAttachmentSize())
                .attachmentData(requestDto.getAttachmentData())
                .build();

        if (requestDto.getPrescriptions() != null) {
            List<Prescription> prescriptions = requestDto.getPrescriptions().stream()
                    .map(pDto -> Prescription.builder()
                            .medicalRecord(record)
                            .medicineName(pDto.getMedicineName())
                            .dosage(pDto.getDosage())
                            .frequency(pDto.getFrequency())
                            .durationDays(pDto.getDurationDays())
                            .instructions(pDto.getInstructions())
                            .build())
                    .collect(Collectors.toList());
            record.setPrescriptions(prescriptions);
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        auditService.logAction(user.getId(), "CREATE", "MedicalRecord", saved.getId());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public MedicalRecordResponseDto updateMedicalRecord(Long recordId, MedicalRecordRequestDto requestDto) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        if (!record.getAppointment().getDoctor().getUser().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("You can only update your own created records");
        }

        record.setDiagnosis(requestDto.getDiagnosis());
        record.setNotes(requestDto.getNotes());
        record.setFollowUpDate(requestDto.getFollowUpDate());
        if (requestDto.getAttachmentName() != null) {
            record.setAttachmentName(requestDto.getAttachmentName());
            record.setAttachmentType(requestDto.getAttachmentType());
            record.setAttachmentSize(requestDto.getAttachmentSize());
            record.setAttachmentData(requestDto.getAttachmentData());
        }

        record.getPrescriptions().clear();
        if (requestDto.getPrescriptions() != null) {
            List<Prescription> newPrescriptions = requestDto.getPrescriptions().stream()
                    .map(pDto -> Prescription.builder()
                            .medicalRecord(record)
                            .medicineName(pDto.getMedicineName())
                            .dosage(pDto.getDosage())
                            .frequency(pDto.getFrequency())
                            .durationDays(pDto.getDurationDays())
                            .instructions(pDto.getInstructions())
                            .build())
                    .collect(Collectors.toList());
            record.getPrescriptions().addAll(newPrescriptions);
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicalRecordResponseDto> getPatientRecords(Pageable pageable) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Page<MedicalRecord> records = medicalRecordRepository.findByAppointment_Patient_Id(user.getId(), pageable);
        
        records.forEach(r -> auditService.logAction(user.getId(), "READ", "MedicalRecord", r.getId()));
        
        return records.map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordResponseDto getMedicalRecordById(Long recordId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        if (!record.getAppointment().getPatient().getId().equals(user.getId())) {
            throw new ForbiddenOperationException("You can only view your own records");
        }

        auditService.logAction(user.getId(), "READ", "MedicalRecord", record.getId());
        return mapToDto(record);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicalRecordResponseDto> getRecordsByPatientIdForDoctor(Long patientId, Pageable pageable) {
        User doctorUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        List<MedicalRecord> allPatientRecords = medicalRecordRepository.findByAppointment_Patient_Id(patientId);
        
        boolean hasTreatedPatient = allPatientRecords.stream()
                .anyMatch(r -> r.getAppointment().getDoctor().getUser().getId().equals(doctorUser.getId()));
                
        if (!hasTreatedPatient) {
            boolean hasAppointment = appointmentRepository.existsByDoctorIdAndPatientId(doctorUser.getId(), patientId);
            if (!hasAppointment) {
                List<Appointment> doctorApts = appointmentRepository.findByDoctorIdOrderByAppointmentTimeDesc(doctorUser.getId());
                hasAppointment = doctorApts.stream().anyMatch(a -> a.getPatient() != null && a.getPatient().getId().equals(patientId));
                if (!hasAppointment) {
                    throw new ForbiddenOperationException("You can only view records for patients you have treated");
                }
            }
        }

        // Return a paginated list
        Page<MedicalRecord> records = medicalRecordRepository.findByAppointment_Patient_Id(patientId, pageable);
        records.forEach(r -> auditService.logAction(doctorUser.getId(), "READ", "MedicalRecord", r.getId()));
        
        return records.map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordResponseDto getMedicalRecordByIdForAdmin(Long recordId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        auditService.logAction(user.getId(), "READ", "MedicalRecord", record.getId());
        return mapToDto(record);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordResponseDto getRecordByAppointmentId(Long appointmentId) {
        MedicalRecord record = medicalRecordRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No medical record found for appointment #" + appointmentId));
        return mapToDto(record);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicalRecordResponseDto> getAllRecordsForDoctor(Pageable pageable) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Page<MedicalRecord> records = medicalRecordRepository.findByAppointment_Doctor_User_Id(user.getId(), pageable);
        return records.map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicalRecordResponseDto> getAllRecordsForAdmin(Pageable pageable) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Page<MedicalRecord> records = medicalRecordRepository.findAll(pageable);
        records.forEach(r -> auditService.logAction(user.getId(), "READ", "MedicalRecord", r.getId()));
        return records.map(this::mapToDto);
    }

    @Override
    @Transactional
    public void deleteMedicalRecordByPatient(Long recordId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        boolean isOwner = record.getAppointment() != null &&
                record.getAppointment().getPatient() != null &&
                record.getAppointment().getPatient().getUser() != null &&
                record.getAppointment().getPatient().getUser().getId().equals(user.getId());

        boolean isAdmin = user.getRoles() != null && user.getRoles().contains(RoleType.ADMIN);

        if (!isOwner && !isAdmin) {
            throw new ForbiddenOperationException("You can only delete your own medical records");
        }

        auditService.logAction(user.getId(), "DELETE", "MedicalRecord", record.getId());
        medicalRecordRepository.delete(record);
    }

    @Override
    @Transactional
    public void deleteMedicalRecordByDoctor(Long recordId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        boolean isAuthor = record.getAppointment() != null &&
                record.getAppointment().getDoctor() != null &&
                record.getAppointment().getDoctor().getUser() != null &&
                record.getAppointment().getDoctor().getUser().getId().equals(user.getId());

        boolean isAdmin = user.getRoles() != null && user.getRoles().contains(RoleType.ADMIN);

        if (!isAuthor && !isAdmin) {
            throw new ForbiddenOperationException("You can only delete medical records you created");
        }

        auditService.logAction(user.getId(), "DELETE", "MedicalRecord", record.getId());
        medicalRecordRepository.delete(record);
    }

    @Override
    @Transactional
    public void deleteMedicalRecordByAdmin(Long recordId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        auditService.logAction(user.getId(), "DELETE", "MedicalRecord", record.getId());
        medicalRecordRepository.delete(record);
    }

    private MedicalRecordResponseDto mapToDto(MedicalRecord record) {
        MedicalRecordResponseDto dto = new MedicalRecordResponseDto();
        dto.setId(record.getId());
        dto.setDiagnosis(record.getDiagnosis());
        dto.setNotes(record.getNotes());
        dto.setFollowUpDate(record.getFollowUpDate());
        dto.setCreatedAt(record.getCreatedAt());
        dto.setUpdatedAt(record.getUpdatedAt());
        
        dto.setAttachmentName(record.getAttachmentName());
        dto.setAttachmentType(record.getAttachmentType());
        dto.setAttachmentSize(record.getAttachmentSize());
        dto.setAttachmentData(record.getAttachmentData());

        if (record.getAppointment() != null) {
            dto.setAppointmentId(record.getAppointment().getId());
            if (record.getAppointment().getDoctor() != null) {
                dto.setDoctorId(record.getAppointment().getDoctor().getId());
                if (record.getAppointment().getDoctor().getName() != null) {
                    dto.setDoctorName(record.getAppointment().getDoctor().getName());
                } else if (record.getAppointment().getDoctor().getUser() != null) {
                    dto.setDoctorName(record.getAppointment().getDoctor().getUser().getName());
                }
                if (record.getAppointment().getDoctor().getSpecialization() != null) {
                    dto.setDoctorSpecialization(record.getAppointment().getDoctor().getSpecialization());
                }
            }
            if (record.getAppointment().getPatient() != null) {
                dto.setPatientId(record.getAppointment().getPatient().getId());
                if (record.getAppointment().getPatient().getUser() != null) {
                    dto.setPatientName(record.getAppointment().getPatient().getUser().getName());
                }
            }
        }
        if (record.getPrescriptions() != null) {
            dto.setPrescriptions(record.getPrescriptions().stream()
                    .map(p -> com.example.me.hospitalmanagement.dto.PrescriptionResponseDto.builder()
                            .id(p.getId())
                            .medicineName(p.getMedicineName())
                            .dosage(p.getDosage())
                            .frequency(p.getFrequency())
                            .durationDays(p.getDurationDays())
                            .instructions(p.getInstructions())
                            .createdAt(p.getCreatedAt())
                            .updatedAt(p.getUpdatedAt())
                            .build())
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}
