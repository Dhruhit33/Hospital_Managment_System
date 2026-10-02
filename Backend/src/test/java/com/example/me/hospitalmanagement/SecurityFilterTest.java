package com.example.me.hospitalmanagement;

import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.repository.UserRepository;
import com.example.me.hospitalmanagement.security.AuthUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.Set;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityFilterTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthUtil authutil;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private UserRepository userRepository;

    @Test
    void protectedEndpoint_NoToken_Returns401() throws Exception {
        mockMvc.perform(get("/admin/patients"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void protectedEndpoint_TamperedToken_Returns401TokenInvalid() throws Exception {
        mockMvc.perform(get("/admin/patients")
                        .header("Authorization", "Bearer invalid.tampered.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("TOKEN_INVALID"))
                .andExpect(jsonPath("$.message").value("Invalid JWT token"));
    }

    @Test
    void patientCallingAdminEndpoint_Returns403Forbidden() throws Exception {
        User patientUser = User.builder()
                .id(100L)
                .username("patientuser@hospital.com")
                .roles(Set.of(RoleType.PATIENT))
                .build();

        when(userRepository.findByUsername("patientuser@hospital.com"))
                .thenReturn(Optional.of(patientUser));

        String token = authutil.generateAccessToken(patientUser);

        mockMvc.perform(get("/admin/patients")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }
}
