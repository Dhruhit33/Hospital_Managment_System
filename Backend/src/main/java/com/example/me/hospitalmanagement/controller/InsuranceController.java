package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.InsuranceDto;
import com.example.me.hospitalmanagement.dto.PatientDto;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.service.InsuranceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patient/insurance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PATIENT')")
public class InsuranceController {

    private final InsuranceService insuranceService;

    @PostMapping
    public ResponseEntity<PatientDto> addOrReplaceInsurance(@Valid @RequestBody InsuranceDto insuranceDto) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(insuranceService.assignInsuranceToPatient(insuranceDto, user.getId()));
    }

    @DeleteMapping
    public ResponseEntity<PatientDto> removeInsurance() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(insuranceService.dissaccociateInsurance(user.getId()));
    }

    @GetMapping
    public ResponseEntity<InsuranceDto> viewInsurance() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        // Wait, InsuranceService doesn't have a getInsurance method. Let's add it there or here.
        return ResponseEntity.ok(insuranceService.getInsuranceByPatientId(user.getId()));
    }
}
