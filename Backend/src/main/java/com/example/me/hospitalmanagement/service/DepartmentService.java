package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.DepartmentDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DepartmentService {
    DepartmentDto createDepartment(DepartmentDto requestDto);
    DepartmentDto updateDepartment(Long id, DepartmentDto requestDto);
    void deleteDepartment(Long id);
    Page<DepartmentDto> getAllDepartments(Pageable pageable);
    DepartmentDto assignDoctor(Long id, Long doctorId);
    DepartmentDto removeDoctor(Long id, Long doctorId);
    DepartmentDto setHeadDoctor(Long id, Long doctorId);
}
