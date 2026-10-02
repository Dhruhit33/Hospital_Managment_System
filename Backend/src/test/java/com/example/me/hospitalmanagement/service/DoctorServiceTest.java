package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.dto.DoctorDto;
import com.example.me.hospitalmanagement.dto.OnboardDoctorRequestDto;
import com.example.me.hospitalmanagement.entity.Doctor;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.DoctorRepository;
import com.example.me.hospitalmanagement.repository.UserRepository;
import com.example.me.hospitalmanagement.service.impl.DoctorServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private org.springframework.cache.CacheManager cacheManager;

    @Mock
    private com.example.me.hospitalmanagement.repository.DepartmentRepository departmentRepository;

    @InjectMocks
    private DoctorServiceImpl doctorService;

    private Doctor doctor;
    private DoctorDto doctorDto;
    private User user;
    private OnboardDoctorRequestDto onboardDto;

    @BeforeEach
    void setUp() {
        user = User.builder().id(5L).username("doc@hospital.com").build();
        doctor = Doctor.builder().id(5L).name("Dr. Strange").email("doc@hospital.com").specialization("Neurology").user(user).build();
        doctorDto = new DoctorDto(5L, "Dr. Strange", "Neurology", "doc@hospital.com");
        onboardDto = new OnboardDoctorRequestDto(5L, "Neurology", "Dr. Strange", "doc@hospital.com");
    }

    @Test
    void getDoctorId_Success() {
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(modelMapper.map(doctor, DoctorDto.class)).thenReturn(doctorDto);

        DoctorDto result = doctorService.getDoctorId(5L);

        assertNotNull(result);
        assertEquals("Dr. Strange", result.getName());
    }

    @Test
    void getDoctorId_NotFound_ThrowsException() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> doctorService.getDoctorId(99L));
    }

    @Test
    void onBoardNewDoctor_Success() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(doctorRepository.existsById(5L)).thenReturn(false);
        when(doctorRepository.save(any(Doctor.class))).thenReturn(doctor);
        when(modelMapper.map(doctor, DoctorDto.class)).thenReturn(doctorDto);

        DoctorDto result = doctorService.onBoardNewDoctor(onboardDto);

        assertNotNull(result);
        assertEquals("Dr. Strange", result.getName());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void onBoardNewDoctor_AlreadyExists_UpdatesAndRestoresDoctor() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(doctorRepository.existsById(5L)).thenReturn(true);
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenReturn(doctor);
        when(modelMapper.map(doctor, DoctorDto.class)).thenReturn(doctorDto);

        DoctorDto result = doctorService.onBoardNewDoctor(onboardDto);

        assertNotNull(result);
        assertEquals("Dr. Strange", result.getName());
        verify(userRepository, times(1)).save(user);
    }
}
