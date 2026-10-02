package com.example.me.hospitalmanagement;

import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import com.example.me.hospitalmanagement.repository.UserRepository;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
public class PatientTest {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testPatientRepository() {
        List<Patient> patients = patientRepository.findAll();
        assertNotNull(patients);
    }

    @Test
    public void testSavingPatientWithBlankNameThrowsConstraintViolation() {
        User user = User.builder().username("blankpatient@hospital.com").build();
        userRepository.save(user);

        Patient patient = Patient.builder()
                .name("")
                .email("blankpatient@hospital.com")
                .user(user)
                .build();

        assertThrows(ConstraintViolationException.class, () -> {
            patientRepository.saveAndFlush(patient);
        });
    }
}
