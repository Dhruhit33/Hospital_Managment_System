package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.dto.DepartmentDto;
import com.example.me.hospitalmanagement.entity.Department;
import com.example.me.hospitalmanagement.entity.Doctor;
import com.example.me.hospitalmanagement.error.exception.BusinessRuleException;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.DepartmentRepository;
import com.example.me.hospitalmanagement.repository.DoctorRepository;
import com.example.me.hospitalmanagement.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "departments", allEntries = true),
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "doctors", allEntries = true)
    })
    public DepartmentDto createDepartment(DepartmentDto requestDto) {
        if (departmentRepository.existsByName(requestDto.getName())) {
            throw new DuplicateResourceException("Department with this name already exists");
        }

        Department dept = Department.builder()
                .name(requestDto.getName())
                .build();

        if (requestDto.getHeadDoctorId() != null) {
            Doctor doctor = doctorRepository.findById(requestDto.getHeadDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + requestDto.getHeadDoctorId()));
            dept.getDoctors().add(doctor);
            doctor.getDepartments().add(dept);
            dept.setHeadDoctor(doctor);
        }
        
        Department saved = departmentRepository.save(dept);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "departments", allEntries = true),
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "doctors", allEntries = true)
    })
    public DepartmentDto updateDepartment(Long id, DepartmentDto requestDto) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        
        if (!dept.getName().equals(requestDto.getName()) && departmentRepository.existsByName(requestDto.getName())) {
            throw new DuplicateResourceException("Department with this name already exists");
        }
        
        dept.setName(requestDto.getName());

        if (requestDto.getHeadDoctorId() != null) {
            Doctor doctor = doctorRepository.findById(requestDto.getHeadDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + requestDto.getHeadDoctorId()));
            if (!dept.getDoctors().contains(doctor)) {
                dept.getDoctors().add(doctor);
                doctor.getDepartments().add(dept);
            }
            dept.setHeadDoctor(doctor);
        } else {
            dept.setHeadDoctor(null);
        }

        Department saved = departmentRepository.save(dept);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "departments", allEntries = true),
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "doctors", allEntries = true)
    })
    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
                
        if (!dept.getDoctors().isEmpty()) {
            throw new BusinessRuleException("Cannot delete a department that has doctors assigned to it");
        }
        
        departmentRepository.delete(dept);
    }

    @Override
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(cacheNames = "departments", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + (#pageable.sort != null ? #pageable.sort.toString() : '')")
    public Page<DepartmentDto> getAllDepartments(Pageable pageable) {
        return departmentRepository.findAll(pageable).map(this::mapToDto);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "departments", allEntries = true),
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "doctors", allEntries = true)
    })
    public DepartmentDto assignDoctor(Long id, Long doctorId) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
                
        dept.getDoctors().add(doctor);
        doctor.getDepartments().add(dept);
        
        Department saved = departmentRepository.save(dept);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "departments", allEntries = true),
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "doctors", allEntries = true)
    })
    public DepartmentDto removeDoctor(Long id, Long doctorId) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
                
        dept.getDoctors().remove(doctor);
        doctor.getDepartments().remove(dept);
        
        if (dept.getHeadDoctor() != null && dept.getHeadDoctor().getId().equals(doctorId)) {
            dept.setHeadDoctor(null);
        }
        
        Department saved = departmentRepository.save(dept);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "departments", allEntries = true),
            @org.springframework.cache.annotation.CacheEvict(cacheNames = "doctors", allEntries = true)
    })
    public DepartmentDto setHeadDoctor(Long id, Long doctorId) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
                
        if (!dept.getDoctors().contains(doctor)) {
            dept.getDoctors().add(doctor);
            doctor.getDepartments().add(dept);
        }
        
        dept.setHeadDoctor(doctor);
        Department saved = departmentRepository.save(dept);
        return mapToDto(saved);
    }

    private DepartmentDto mapToDto(Department dept) {
        java.util.List<com.example.me.hospitalmanagement.dto.DoctorDto> doctorDtos = new java.util.ArrayList<>();
        if (dept.getDoctors() != null) {
            for (Doctor d : dept.getDoctors()) {
                doctorDtos.add(com.example.me.hospitalmanagement.dto.DoctorDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .specialization(d.getSpecialization())
                        .email(d.getEmail())
                        .departmentId(dept.getId())
                        .departmentName(dept.getName())
                        .build());
            }
        }

        return DepartmentDto.builder()
                .id(dept.getId())
                .name(dept.getName())
                .headDoctorId(dept.getHeadDoctor() != null ? dept.getHeadDoctor().getId() : null)
                .headDoctorName(dept.getHeadDoctor() != null ? dept.getHeadDoctor().getName() : null)
                .headDoctorSpecialization(dept.getHeadDoctor() != null ? dept.getHeadDoctor().getSpecialization() : null)
                .doctorCount(doctorDtos.size())
                .doctors(doctorDtos)
                .build();
    }
}
