package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.DoctorAvailabilityRequestDto;
import com.example.me.hospitalmanagement.dto.DoctorAvailabilityResponseDto;
import com.example.me.hospitalmanagement.dto.DoctorLeaveRequestDto;
import com.example.me.hospitalmanagement.dto.DoctorLeaveResponseDto;
import com.example.me.hospitalmanagement.dto.DoctorDto;
import com.example.me.hospitalmanagement.dto.OnboardDoctorRequestDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface DoctorService {
    List<DoctorDto> getAllDoctors();
    Page<DoctorDto> getAllDoctorsPaginated(Integer pageNumber, Integer pageSize);
    DoctorDto getDoctorId(Long id);
    DoctorDto AddDoctor(DoctorDto doctorDto);
    DoctorDto updateDoctor(Long id, DoctorDto doctorDto);
    DoctorDto onBoardNewDoctor(OnboardDoctorRequestDto doctorDto);
    
    DoctorAvailabilityResponseDto setAvailability(Long userId, DoctorAvailabilityRequestDto requestDto);
    DoctorAvailabilityResponseDto getAvailability(Long userId);
    DoctorAvailabilityResponseDto getAvailabilityByDoctorId(Long doctorId);
    DoctorLeaveResponseDto addLeave(Long userId, DoctorLeaveRequestDto requestDto);
    Page<DoctorDto> searchDoctors(String name, String specialization, Long departmentId, org.springframework.data.domain.Pageable pageable);
    List<com.example.me.hospitalmanagement.dto.DoctorPatientSummaryDto> getPatientsOfDoctor(Long userId);
}
