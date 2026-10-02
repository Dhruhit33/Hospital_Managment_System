package com.example.me.hospitalmanagement;

import com.example.me.hospitalmanagement.dto.InsuranceDto;
import com.example.me.hospitalmanagement.dto.PatientDto;
import com.example.me.hospitalmanagement.entity.Insurance;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import com.example.me.hospitalmanagement.repository.UserRepository;
import com.example.me.hospitalmanagement.service.InsuranceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
public class InsuranceTest {

    @Autowired
    private InsuranceService insuranceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Test
    public void testInsurence() {
        User user = User.builder().username("testpatient@hospital.com").password("pass").build();
        userRepository.save(user);

        Patient patient = Patient.builder().name("Test Patient").email("testpatient@hospital.com").user(user).build();
        patientRepository.save(patient);

        InsuranceDto insuranceDto = InsuranceDto.builder()
                .policyNumber("HDFC_1234")
                .provider("HDFC")
                .validUntil(java.time.LocalDate.parse("2030-01-01"))
                .build();

        PatientDto updatedPatient = insuranceService.assignInsuranceToPatient(insuranceDto, user.getId());
        assertNotNull(updatedPatient);

        PatientDto dissociated = insuranceService.dissaccociateInsurance(user.getId());
        assertNotNull(dissociated);
    }
}
