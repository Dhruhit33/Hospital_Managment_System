package com.example.me.hospitalmanagement;

import com.example.me.hospitalmanagement.dto.CreateAppointmentDto;
import com.example.me.hospitalmanagement.dto.DoctorAvailabilityRequestDto;
import com.example.me.hospitalmanagement.dto.DoctorDto;
import com.example.me.hospitalmanagement.dto.SlotResponseDto;
import com.example.me.hospitalmanagement.entity.Doctor;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.repository.AppointmentRepository;
import com.example.me.hospitalmanagement.repository.DoctorRepository;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import com.example.me.hospitalmanagement.repository.UserRepository;
import com.example.me.hospitalmanagement.service.AppointmentService;
import com.example.me.hospitalmanagement.service.DoctorService;
import com.example.me.hospitalmanagement.service.SlotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class CachingIntegrationTest {

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private SlotService slotService;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private CacheManager cacheManager;

    @BeforeEach
    void clearAllCachesAndData() {
        for (String name : cacheManager.getCacheNames()) {
            if (cacheManager.getCache(name) != null) {
                cacheManager.getCache(name).clear();
            }
        }
    }

    @Test
    @Transactional
    void doctorListCache_DifferentPages_ReturnDifferentResults() {
        User u1 = userRepository.save(User.builder().username("doc1@test.com").password("pass").roles(Set.of(RoleType.DOCTOR)).build());
        User u2 = userRepository.save(User.builder().username("doc2@test.com").password("pass").roles(Set.of(RoleType.DOCTOR)).build());

        Doctor d1 = doctorRepository.save(Doctor.builder().id(u1.getId()).name("Dr. Alpha").email("doc1@test.com").user(u1).build());
        Doctor d2 = doctorRepository.save(Doctor.builder().id(u2.getId()).name("Dr. Beta").email("doc2@test.com").user(u2).build());

        Page<DoctorDto> page0 = doctorService.getAllDoctorsPaginated(0, 1);
        Page<DoctorDto> page1 = doctorService.getAllDoctorsPaginated(1, 1);

        assertNotNull(page0);
        assertNotNull(page1);
        assertEquals(1, page0.getContent().size());
        assertEquals(1, page1.getContent().size());

        // Assert page 0 and page 1 do NOT return the same doctor (catches missing page key bug)
        assertNotEquals(page0.getContent().get(0).getId(), page1.getContent().get(0).getId());
    }

    @Test
    @Transactional
    void doctorUpdate_EvictsCache_ReturnsUpdatedData() {
        User u = userRepository.save(User.builder().username("upd@test.com").password("pass").roles(Set.of(RoleType.DOCTOR)).build());
        Doctor d = doctorRepository.save(Doctor.builder().id(u.getId()).name("Original Name").email("upd@test.com").user(u).build());

        // First fetch - populates cache
        DoctorDto initial = doctorService.getDoctorId(d.getId());
        assertEquals("Original Name", initial.getName());

        // Update doctor - should evict the cache
        doctorService.updateDoctor(d.getId(), DoctorDto.builder().name("Updated Name").email("upd@test.com").build());

        // Second fetch - should reflect the updated name, not the stale cached name
        DoctorDto afterUpdate = doctorService.getDoctorId(d.getId());
        assertEquals("Updated Name", afterUpdate.getName());
    }

    @Test
    void bookingAppointment_EvictsSlotCache_BookedSlotIsGone() {
        User docUser = userRepository.save(User.builder().username("slotdoc@test.com").password("pass").roles(Set.of(RoleType.DOCTOR)).build());
        Doctor doctor = doctorRepository.save(Doctor.builder().id(docUser.getId()).name("Dr. Slots").email("slotdoc@test.com").user(docUser).build());

        User patUser = userRepository.save(User.builder().username("slotpat@test.com").password("pass").roles(Set.of(RoleType.PATIENT)).build());
        Patient patient = patientRepository.save(Patient.builder().id(patUser.getId()).name("Patient Slot").email("slotpat@test.com").user(patUser).build());

        // Authenticate as the patient
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(patUser, null, patUser.getAuthorities())
        );

        // Target next Wednesday to guarantee a future date
        LocalDate targetDate = LocalDate.now().plusWeeks(1).with(TemporalAdjusters.next(DayOfWeek.WEDNESDAY));

        // Setup availability for Wednesday 10:00 - 12:00
        DoctorAvailabilityRequestDto.AvailabilitySlotDto slot = DoctorAvailabilityRequestDto.AvailabilitySlotDto.builder()
                .dayOfWeek(DayOfWeek.WEDNESDAY)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .build();

        DoctorAvailabilityRequestDto availDto = DoctorAvailabilityRequestDto.builder()
                .availabilities(List.of(slot))
                .build();

        doctorService.setAvailability(docUser.getId(), availDto);

        // Fetch available slots - should be cached
        SlotResponseDto initialSlots = slotService.getAvailableSlots(doctor.getId(), targetDate);
        assertTrue(initialSlots.getAvailableSlots().contains(LocalTime.of(10, 0)));

        // Book 10:00 slot - triggers cache eviction on slots
        LocalDateTime bookingTime = targetDate.atTime(10, 0);
        CreateAppointmentDto appointmentDto = CreateAppointmentDto.builder()
                .doctorId(doctor.getId())
                .appointmentTime(bookingTime)
                .reason("Dental cleaning")
                .build();

        appointmentService.createNewAppointment(appointmentDto);

        // Fetch available slots again - 10:00 MUST BE GONE
        SlotResponseDto updatedSlots = slotService.getAvailableSlots(doctor.getId(), targetDate);
        assertFalse(updatedSlots.getAvailableSlots().contains(LocalTime.of(10, 0)));
    }
}
