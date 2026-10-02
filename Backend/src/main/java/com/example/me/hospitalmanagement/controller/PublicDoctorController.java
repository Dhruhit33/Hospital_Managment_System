package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.DoctorDto;
import com.example.me.hospitalmanagement.service.DoctorService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/doctors")
@RequiredArgsConstructor
@Validated
public class PublicDoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public ResponseEntity<Page<DoctorDto>> getPublicDoctors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) Integer pageNumber,
            @RequestParam(value = "size", defaultValue = "10") @Min(1) @Max(100) Integer pageSize,
            @RequestParam(value = "sort", defaultValue = "id,asc") String[] sort
    ) {
        org.springframework.data.domain.Sort sorting = org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.fromString(sort.length > 1 ? sort[1] : "asc"), 
                sort[0]
        );
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(pageNumber, Math.min(pageSize, 100), sorting);
        return ResponseEntity.ok(doctorService.searchDoctors(name, specialization, departmentId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDto> getPublicDoctorById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(doctorService.getDoctorId(id));
    }
}
