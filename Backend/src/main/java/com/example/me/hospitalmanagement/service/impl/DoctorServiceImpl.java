package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.dto.DoctorDto;
import com.example.me.hospitalmanagement.dto.OnboardDoctorRequestDto;
import com.example.me.hospitalmanagement.entity.Doctor;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.DoctorRepository;
import com.example.me.hospitalmanagement.repository.UserRepository;
import com.example.me.hospitalmanagement.service.DoctorService;
import com.example.me.hospitalmanagement.dto.DoctorAvailabilityRequestDto;
import com.example.me.hospitalmanagement.dto.DoctorAvailabilityResponseDto;
import com.example.me.hospitalmanagement.dto.DoctorLeaveRequestDto;
import com.example.me.hospitalmanagement.dto.DoctorLeaveResponseDto;
import com.example.me.hospitalmanagement.entity.DoctorAvailability;
import com.example.me.hospitalmanagement.entity.DoctorLeave;
import com.example.me.hospitalmanagement.repository.DoctorAvailabilityRepository;
import com.example.me.hospitalmanagement.repository.DoctorLeaveRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final com.example.me.hospitalmanagement.repository.DepartmentRepository departmentRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final DoctorLeaveRepository leaveRepository;
    private final com.example.me.hospitalmanagement.repository.AppointmentRepository appointmentRepository;
    private final com.example.me.hospitalmanagement.repository.PatientRepository patientRepository;
    private final org.springframework.cache.CacheManager cacheManager;
    private static final String DOCTOR_CACHE = com.example.me.hospitalmanagement.constant.AppConstants.DOCTOR_CACHE;

    private DoctorDto mapDoctorToDto(Doctor doctor) {
        if (doctor == null) return null;
        DoctorDto dto = modelMapper.map(doctor, DoctorDto.class);
        if (doctor.getDepartments() != null && !doctor.getDepartments().isEmpty()) {
            com.example.me.hospitalmanagement.entity.Department firstDept = doctor.getDepartments().iterator().next();
            dto.setDepartmentId(firstDept.getId());
            dto.setDepartmentName(firstDept.getName());
        }
        return dto;
    }

    private void evictAllSlotsForDoctor(Long doctorId) {
        if (doctorId != null && cacheManager != null) {
            org.springframework.cache.Cache slotsCache = cacheManager.getCache("slots");
            if (slotsCache != null) {
                Object nativeCache = slotsCache.getNativeCache();
                if (nativeCache instanceof java.util.concurrent.ConcurrentMap<?, ?> map) {
                    map.keySet().removeIf(key -> key.toString().startsWith(doctorId + "-") || key.toString().startsWith(doctorId + "_"));
                } else {
                    slotsCache.clear();
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorDto> getAllDoctors() {
        return doctorRepository.findAllWithDepartments()
                .stream()
                .filter(d -> d.getUser() != null && d.getUser().getRoles() != null && d.getUser().getRoles().contains(RoleType.DOCTOR))
                .map(this::mapDoctorToDto)
                .toList();
    }

    @Override
    @Cacheable(cacheNames = DOCTOR_CACHE, key = "'page_' + #pageNumber + '_' + #pageSize")
    public Page<DoctorDto> getAllDoctorsPaginated(Integer pageNumber, Integer pageSize) {
        org.springframework.data.jpa.domain.Specification<Doctor> spec = org.springframework.data.jpa.domain.Specification.where(
                com.example.me.hospitalmanagement.service.DoctorSpecification.fetchDepartments())
                .and(com.example.me.hospitalmanagement.service.DoctorSpecification.withActiveDoctorRole());
        return doctorRepository.findAll(spec, PageRequest.of(pageNumber, pageSize))
                .map(this::mapDoctorToDto);
    }

    @Override
    @Cacheable(cacheNames = DOCTOR_CACHE, key = "#id")
    @Transactional(readOnly = true)
    public DoctorDto getDoctorId(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        return mapDoctorToDto(doctor);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @org.springframework.cache.annotation.CacheEvict(cacheNames = DOCTOR_CACHE, allEntries = true)
    })
    public DoctorDto AddDoctor(DoctorDto doctorDto) {
        Doctor doctor = modelMapper.map(doctorDto, Doctor.class);
        Doctor savedDoctor = doctorRepository.save(doctor);
        return mapDoctorToDto(savedDoctor);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @org.springframework.cache.annotation.CacheEvict(cacheNames = DOCTOR_CACHE, allEntries = true)
    })
    public DoctorDto updateDoctor(Long id, DoctorDto doctorDto) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        if (doctorDto.getName() != null) doctor.setName(doctorDto.getName());
        if (doctorDto.getSpecialization() != null) doctor.setSpecialization(doctorDto.getSpecialization());
        if (doctorDto.getEmail() != null) doctor.setEmail(doctorDto.getEmail());
        Doctor saved = doctorRepository.save(doctor);
        return mapDoctorToDto(saved);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(
            put = { @CachePut(cacheNames = DOCTOR_CACHE, key = "#result.id") },
            evict = {
                @org.springframework.cache.annotation.CacheEvict(cacheNames = DOCTOR_CACHE, allEntries = true),
                @org.springframework.cache.annotation.CacheEvict(cacheNames = "departments", allEntries = true)
            }
    )
    public DoctorDto onBoardNewDoctor(OnboardDoctorRequestDto doctorDto) {
        User user = userRepository.findById(doctorDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + doctorDto.getUserId()));

        Doctor doctor;
        if (doctorRepository.existsById(doctorDto.getUserId())) {
            doctor = doctorRepository.findById(doctorDto.getUserId())
                    .orElseGet(() -> Doctor.builder().user(user).build());
            if (doctorDto.getName() != null && !doctorDto.getName().isBlank()) {
                doctor.setName(doctorDto.getName());
            }
            if (doctorDto.getSpecialization() != null && !doctorDto.getSpecialization().isBlank()) {
                doctor.setSpecialization(doctorDto.getSpecialization());
            }
            if (doctorDto.getEmail() != null && !doctorDto.getEmail().isBlank()) {
                doctor.setEmail(doctorDto.getEmail());
            }
        } else {
            doctor = Doctor.builder()
                    .name(doctorDto.getName())
                    .specialization(doctorDto.getSpecialization())
                    .email(doctorDto.getEmail())
                    .user(user)
                    .build();
        }

        user.getRoles().add(RoleType.DOCTOR);
        user.getRoles().remove(RoleType.PATIENT);
        userRepository.save(user);

        Doctor savedDoctor = doctorRepository.save(doctor);

        if (doctorDto.getDepartmentId() != null) {
            com.example.me.hospitalmanagement.entity.Department dept = departmentRepository.findById(doctorDto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + doctorDto.getDepartmentId()));
            if (!dept.getDoctors().contains(savedDoctor)) {
                dept.getDoctors().add(savedDoctor);
            }
            if (!savedDoctor.getDepartments().contains(dept)) {
                savedDoctor.getDepartments().add(dept);
            }
            departmentRepository.save(dept);
        }

        return mapDoctorToDto(savedDoctor);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(cacheNames = "doctor-availability", key = "#result.doctorId")
    public DoctorAvailabilityResponseDto setAvailability(Long userId, DoctorAvailabilityRequestDto requestDto) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found for user id: " + userId));

        availabilityRepository.deleteByDoctorId(doctor.getId());

        List<DoctorAvailability> availabilities = requestDto.getAvailabilities().stream()
                .map(slot -> DoctorAvailability.builder()
                        .doctor(doctor)
                        .dayOfWeek(slot.getDayOfWeek())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .build())
                .toList();

        availabilityRepository.saveAll(availabilities);
        evictAllSlotsForDoctor(doctor.getId());

        return getAvailabilityByDoctorId(doctor.getId());
    }

    @Override
    public DoctorAvailabilityResponseDto getAvailability(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found for user id: " + userId));

        return getAvailabilityByDoctorId(doctor.getId());
    }

    @Override
    @Cacheable(cacheNames = "doctor-availability", key = "#doctorId")
    public DoctorAvailabilityResponseDto getAvailabilityByDoctorId(Long doctorId) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }

        List<DoctorAvailability> availabilities = availabilityRepository.findByDoctorId(doctorId);

        List<DoctorAvailabilityResponseDto.AvailabilitySlotDto> slotDtos = availabilities.stream()
                .map(a -> DoctorAvailabilityResponseDto.AvailabilitySlotDto.builder()
                        .id(a.getId())
                        .dayOfWeek(a.getDayOfWeek())
                        .startTime(a.getStartTime())
                        .endTime(a.getEndTime())
                        .build())
                .toList();

        return DoctorAvailabilityResponseDto.builder()
                .doctorId(doctorId)
                .availabilities(slotDtos)
                .build();
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(cacheNames = "doctor-availability", key = "#result.doctorId")
    public DoctorLeaveResponseDto addLeave(Long userId, DoctorLeaveRequestDto requestDto) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found for user id: " + userId));

        if (leaveRepository.existsByDoctorIdAndLeaveDate(doctor.getId(), requestDto.getLeaveDate())) {
            throw new DuplicateResourceException("Leave already exists for date: " + requestDto.getLeaveDate());
        }

        DoctorLeave leave = DoctorLeave.builder()
                .doctor(doctor)
                .leaveDate(requestDto.getLeaveDate())
                .reason(requestDto.getReason())
                .build();

        DoctorLeave savedLeave = leaveRepository.save(leave);
        evictAllSlotsForDoctor(doctor.getId());

        return DoctorLeaveResponseDto.builder()
                .id(savedLeave.getId())
                .doctorId(doctor.getId())
                .leaveDate(savedLeave.getLeaveDate())
                .reason(savedLeave.getReason())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = DOCTOR_CACHE, key = "(#name != null ? #name : '') + '-' + (#specialization != null ? #specialization : '') + '-' + (#departmentId != null ? #departmentId : '') + '-' + #pageable.pageNumber + '-' + #pageable.pageSize + '-' + (#pageable.sort != null ? #pageable.sort.toString() : '')")
    public Page<DoctorDto> searchDoctors(String name, String specialization, Long departmentId, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<Doctor> spec = org.springframework.data.jpa.domain.Specification.where(
                com.example.me.hospitalmanagement.service.DoctorSpecification.fetchDepartments())
                .and(com.example.me.hospitalmanagement.service.DoctorSpecification.withActiveDoctorRole())
                .and(com.example.me.hospitalmanagement.service.DoctorSpecification.withName(name))
                .and(com.example.me.hospitalmanagement.service.DoctorSpecification.withSpecialization(specialization))
                .and(com.example.me.hospitalmanagement.service.DoctorSpecification.withDepartment(departmentId));

        return doctorRepository.findAll(spec, pageable).map(this::mapDoctorToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.example.me.hospitalmanagement.dto.DoctorPatientSummaryDto> getPatientsOfDoctor(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found for user id: " + userId));

        List<com.example.me.hospitalmanagement.entity.Appointment> appointments =
                appointmentRepository.findByDoctorIdOrderByAppointmentTimeDesc(doctor.getId());

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        List<com.example.me.hospitalmanagement.dto.DoctorPatientSummaryDto> summaries = new java.util.ArrayList<>();
        java.util.Set<Long> seenPatientIds = new java.util.HashSet<>();

        // Group appointments by patient
        java.util.Map<Long, List<com.example.me.hospitalmanagement.entity.Appointment>> appointmentsByPatient = appointments.stream()
                .filter(a -> a.getPatient() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        a -> a.getPatient().getId(),
                        java.util.LinkedHashMap::new,
                        java.util.stream.Collectors.toList()
                ));

        for (java.util.Map.Entry<Long, List<com.example.me.hospitalmanagement.entity.Appointment>> entry : appointmentsByPatient.entrySet()) {
            List<com.example.me.hospitalmanagement.entity.Appointment> patientApts = entry.getValue();
            com.example.me.hospitalmanagement.entity.Appointment latestApt = patientApts.get(0);
            com.example.me.hospitalmanagement.entity.Patient patient = latestApt.getPatient();

            // Exclude if patient record happens to match the doctor themselves
            if (patient.getId().equals(doctor.getId()) ||
                (patient.getEmail() != null && patient.getEmail().equalsIgnoreCase(doctor.getEmail()))) {
                continue;
            }

            seenPatientIds.add(patient.getId());

            java.time.LocalDateTime lastPast = patientApts.stream()
                    .map(com.example.me.hospitalmanagement.entity.Appointment::getAppointmentTime)
                    .filter(t -> t.isBefore(now))
                    .max(java.time.LocalDateTime::compareTo)
                    .orElse(null);

            java.time.LocalDateTime nextUpcoming = patientApts.stream()
                    .map(com.example.me.hospitalmanagement.entity.Appointment::getAppointmentTime)
                    .filter(t -> t.isAfter(now))
                    .min(java.time.LocalDateTime::compareTo)
                    .orElse(null);

            summaries.add(com.example.me.hospitalmanagement.dto.DoctorPatientSummaryDto.builder()
                    .id(patient.getId())
                    .name(patient.getName())
                    .email(patient.getEmail())
                    .gender(patient.getGender())
                    .bloodGroup(patient.getBloodGroup())
                    .birthDate(patient.getBirthDate())
                    .emergencyContact(patient.getEmergencyContact())
                    .allergies(patient.getAllergies())
                    .totalAppointments(patientApts.size())
                    .lastAppointmentTime(lastPast != null ? lastPast : latestApt.getAppointmentTime())
                    .nextAppointmentTime(nextUpcoming)
                    .latestReason(latestApt.getReason())
                    .latestStatus(latestApt.getStatus())
                    .build());
        }

        return summaries;
    }
}
