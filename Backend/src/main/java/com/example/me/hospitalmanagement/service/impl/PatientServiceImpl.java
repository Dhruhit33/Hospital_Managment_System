package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.dto.PatientDto;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import com.example.me.hospitalmanagement.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final ModelMapper modelMapper;



    private final com.example.me.hospitalmanagement.repository.UserRepository userRepository;

    @Override
    public org.springframework.data.domain.Page<PatientDto> searchPatients(String name, String bloodGroup, java.time.LocalDate bornAfter, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<Patient> spec = org.springframework.data.jpa.domain.Specification.where(
                com.example.me.hospitalmanagement.service.PatientSpecification.withName(name))
                .and(com.example.me.hospitalmanagement.service.PatientSpecification.withBloodGroup(bloodGroup))
                .and(com.example.me.hospitalmanagement.service.PatientSpecification.withBornAfter(bornAfter));
                
        return patientRepository.findAll(spec, pageable)
                .map(patient -> modelMapper.map(patient, PatientDto.class));
    }

    @Override
    public PatientDto getPatientId(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        return modelMapper.map(patient, PatientDto.class);
    }

    @Override
    public PatientDto addPatient(PatientDto patientDto) {
        Patient patient = modelMapper.map(patientDto,Patient.class);
        Patient patient1 = patientRepository.save(patient);
        return modelMapper.map(patient1,PatientDto.class);
    }

    @Override
    public PatientDto getPatientProfile(Long userId) {
        Patient patient = patientRepository.findById(userId).orElseGet(() -> {
            com.example.me.hospitalmanagement.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            Patient newPatient = Patient.builder()
                    .user(user)
                    .name(user.getUsername().split("@")[0])
                    .email(user.getUsername())
                    .build();
            return patientRepository.save(newPatient);
        });
        return modelMapper.map(patient, PatientDto.class);
    }

    @Override
    public PatientDto updatePatientProfile(Long userId, com.example.me.hospitalmanagement.dto.UpdatePatientProfileDto dto) {
        Patient patient = patientRepository.findById(userId).orElseGet(() -> {
            com.example.me.hospitalmanagement.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
            return Patient.builder()
                    .user(user)
                    .name(user.getUsername().split("@")[0])
                    .email(user.getUsername())
                    .build();
        });

        if (dto.getName() != null && !dto.getName().isBlank()) {
            String trimmedName = dto.getName().trim();
            patient.setName(trimmedName);
            if (patient.getUser() != null) {
                patient.getUser().setName(trimmedName);
                userRepository.save(patient.getUser());
            }
        }
        if (dto.getGender() != null && !dto.getGender().isBlank()) {
            patient.setGender(dto.getGender().trim());
        }
        if (dto.getBloodGroup() != null) {
            patient.setBloodGroup(dto.getBloodGroup());
        }
        if (dto.getBirthDate() != null) {
            patient.setBirthDate(dto.getBirthDate());
        }

        Patient saved = patientRepository.save(patient);
        return modelMapper.map(saved, PatientDto.class);
    }
}
