package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.DepartmentDto;
import com.example.me.hospitalmanagement.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping("/admin/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDto> createDepartment(@Valid @RequestBody DepartmentDto requestDto) {
        return new ResponseEntity<>(departmentService.createDepartment(requestDto), HttpStatus.CREATED);
    }

    @PutMapping("/admin/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDto> updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentDto requestDto) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, requestDto));
    }

    @DeleteMapping("/admin/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/public/departments")
    public ResponseEntity<Page<DepartmentDto>> getAllDepartments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(departmentService.getAllDepartments(pageable));
    }

    @PostMapping("/admin/departments/{id}/doctors/{doctorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDto> assignDoctor(@PathVariable Long id, @PathVariable Long doctorId) {
        return ResponseEntity.ok(departmentService.assignDoctor(id, doctorId));
    }

    @DeleteMapping("/admin/departments/{id}/doctors/{doctorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDto> removeDoctor(@PathVariable Long id, @PathVariable Long doctorId) {
        return ResponseEntity.ok(departmentService.removeDoctor(id, doctorId));
    }

    @PutMapping("/admin/departments/{id}/head/{doctorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDto> setHeadDoctor(@PathVariable Long id, @PathVariable Long doctorId) {
        return ResponseEntity.ok(departmentService.setHeadDoctor(id, doctorId));
    }
}
