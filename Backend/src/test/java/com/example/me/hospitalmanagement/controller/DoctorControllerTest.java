package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.dto.DoctorDto;
import com.example.me.hospitalmanagement.error.GlobalExceptionHandler;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.UserRepository;
import com.example.me.hospitalmanagement.security.AuthUtil;
import com.example.me.hospitalmanagement.security.JwtAuthFilter;
import com.example.me.hospitalmanagement.security.OAuth2SuccessHandler;
import com.example.me.hospitalmanagement.service.AppointmentService;
import com.example.me.hospitalmanagement.service.DoctorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DoctorController.class, excludeAutoConfiguration = {
        org.springframework.boot.security.oauth2.client.autoconfigure.servlet.OAuth2ClientWebSecurityAutoConfiguration.class,
        org.springframework.boot.security.oauth2.client.autoconfigure.OAuth2ClientAutoConfiguration.class
})
@org.springframework.test.context.ContextConfiguration(classes = com.example.me.hospitalmanagement.HospitalManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class DoctorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DoctorService doctorService;

    @MockitoBean
    private AppointmentService appointmentService;

    @MockitoBean
    private com.example.me.hospitalmanagement.service.SlotService slotService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private AuthUtil authutil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @MockitoBean
    private org.springframework.cache.CacheManager cacheManager;

    @Test
    @WithMockUser(roles = "DOCTOR")
    void findDoctorByDoctorId_Success() throws Exception {
        when(doctorService.getDoctorId(10L))
                .thenReturn(new DoctorDto(10L, "Dr. House", "Diagnostics", "house@hospital.com"));

        mockMvc.perform(get("/doctor/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Dr. House"));
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void findDoctorByDoctorId_NotFound_Returns404() throws Exception {
        when(doctorService.getDoctorId(9999L))
                .thenThrow(new ResourceNotFoundException("Doctor not found with id: 9999"));

        mockMvc.perform(get("/doctor/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Doctor not found with id: 9999"));
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void findDoctorByDoctorId_TypeMismatch_Returns400() throws Exception {
        mockMvc.perform(get("/doctor/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("TYPE_MISMATCH"))
                .andExpect(jsonPath("$.message").value("Parameter 'id' must be of type Long"));
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void genericException_Returns500WithGenericMessage() throws Exception {
        when(doctorService.getDoctorId(1L))
                .thenThrow(new RuntimeException("Database error details"));

        mockMvc.perform(get("/doctor/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.code").value("INTERNAL_SERVER_ERROR"))
                .andExpect(jsonPath("$.message").value("Something went wrong. Please try again later."))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }
}
