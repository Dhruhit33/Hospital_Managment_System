package com.example.me.hospitalmanagement.controller;

import com.example.me.hospitalmanagement.security.AuthService;
import com.example.me.hospitalmanagement.security.JwtAuthFilter;
import com.example.me.hospitalmanagement.dto.LoginRequestDto;
import com.example.me.hospitalmanagement.dto.LoginResponseDto;
import com.example.me.hospitalmanagement.dto.SignUpRequestDto;
import com.example.me.hospitalmanagement.dto.SignupResponseDto;
import com.example.me.hospitalmanagement.error.GlobalExceptionHandler;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.repository.UserRepository;
import com.example.me.hospitalmanagement.security.AuthUtil;
import com.example.me.hospitalmanagement.security.OAuth2SuccessHandler;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class, excludeAutoConfiguration = {
        org.springframework.boot.security.oauth2.client.autoconfigure.servlet.OAuth2ClientWebSecurityAutoConfiguration.class,
        org.springframework.boot.security.oauth2.client.autoconfigure.OAuth2ClientAutoConfiguration.class
})
@org.springframework.test.context.ContextConfiguration(classes = com.example.me.hospitalmanagement.HospitalManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

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

    @MockitoBean
    private com.example.me.hospitalmanagement.security.RefreshTokenService refreshTokenService;

    @Test
    void login_Success() throws Exception {
        LoginRequestDto request = LoginRequestDto.builder()
                .username("user@hospital.com")
                .password("Password123!")
                .build();

        when(authService.login(any(LoginRequestDto.class)))
                .thenReturn(new LoginResponseDto("jwt_token_example", 1L));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jwt").value("jwt_token_example"))
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    void login_WrongPassword_Returns401() throws Exception {
        LoginRequestDto request = LoginRequestDto.builder()
                .username("user@hospital.com")
                .password("WrongPassword123!")
                .build();

        when(authService.login(any(LoginRequestDto.class)))
                .thenThrow(new BadCredentialsException("Invalid username or password"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("BAD_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void signup_Success() throws Exception {
        SignUpRequestDto request = SignUpRequestDto.builder()
                .username("newuser@hospital.com")
                .password("Password123!")
                .name("New User")
                .build();

        when(authService.signup(any(SignUpRequestDto.class)))
                .thenReturn(new SignupResponseDto(2L, "newuser@hospital.com"));

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("newuser@hospital.com"));
    }

    @Test
    void signup_InvalidInput_Returns400WithFieldErrors() throws Exception {
        SignUpRequestDto request = SignUpRequestDto.builder()
                .username("invalid-email")
                .password("weak")
                .name("")
                .build();

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void signup_Duplicate_Returns409() throws Exception {
        SignUpRequestDto request = SignUpRequestDto.builder()
                .username("existing@hospital.com")
                .password("Password123!")
                .name("Existing")
                .build();

        when(authService.signup(any(SignUpRequestDto.class)))
                .thenThrow(new DuplicateResourceException("User already exists"));

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.code").value("DUPLICATE_RESOURCE"))
                .andExpect(jsonPath("$.message").value("User already exists"));
    }

    @Test
    void malformedJson_Returns400() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ invalid json }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("MALFORMED_JSON"));
    }

    @Test
    void deleteAuthLogin_Returns405() throws Exception {
        mockMvc.perform(delete("/auth/login"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
    }
}
