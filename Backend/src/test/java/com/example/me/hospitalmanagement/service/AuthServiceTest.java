package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.security.AuthService;
import com.example.me.hospitalmanagement.dto.LoginRequestDto;
import com.example.me.hospitalmanagement.dto.LoginResponseDto;
import com.example.me.hospitalmanagement.dto.SignUpRequestDto;
import com.example.me.hospitalmanagement.dto.SignupResponseDto;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.type.AuthProviderType;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import com.example.me.hospitalmanagement.repository.UserRepository;
import com.example.me.hospitalmanagement.security.AuthUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthUtil authutil;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private com.example.me.hospitalmanagement.security.RefreshTokenService refreshTokenService;

    @Mock
    private com.example.me.hospitalmanagement.repository.DoctorRepository doctorRepository;

    @Mock
    private com.example.me.hospitalmanagement.security.OtpService otpService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private SignUpRequestDto signUpRequestDto;
    private LoginRequestDto loginRequestDto;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("patient@test.com")
                .password("encoded_pass")
                .roles(Set.of(RoleType.PATIENT))
                .authProviderType(AuthProviderType.EMAIL)
                .build();

        signUpRequestDto = SignUpRequestDto.builder()
                .username("patient@test.com")
                .password("password123")
                .name("John Doe")
                .build();

        loginRequestDto = LoginRequestDto.builder()
                .username("patient@test.com")
                .password("password123")
                .build();
    }

    @Test
    void login_Success() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authutil.generateAccessToken(testUser)).thenReturn("mock_token");
        when(refreshTokenService.generateRefreshToken(testUser)).thenReturn("mock_refresh_token");

        LoginResponseDto response = authService.login(loginRequestDto);

        assertNotNull(response);
        assertEquals("mock_token", response.getJwt());
        assertEquals(1L, response.getUserId());
        assertEquals("mock_refresh_token", response.getRefreshToken());
    }

    @Test
    void signup_Success() {
        when(userRepository.findByUsername(signUpRequestDto.getUsername())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(signUpRequestDto.getPassword())).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(patientRepository.save(any(Patient.class))).thenReturn(new Patient());

        SignupResponseDto response = authService.signup(signUpRequestDto);

        assertNotNull(response);
        assertEquals("patient@test.com", response.getUsername());
        verify(userRepository, times(1)).save(any(User.class));
        verify(patientRepository, times(1)).save(any(Patient.class));
    }

    @Test
    void signup_DuplicateUser_ThrowsException() {
        when(userRepository.findByUsername(signUpRequestDto.getUsername())).thenReturn(Optional.of(testUser));

        assertThrows(DuplicateResourceException.class, () -> authService.signup(signUpRequestDto));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void handleOAuth2LoginRequest_ExistingUserWithSameEmail_LinksProviderAndSucceeds() {
        org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = mock(org.springframework.security.oauth2.core.user.OAuth2User.class);
        when(oAuth2User.getAttribute("name")).thenReturn("Google Patient");
        when(oAuth2User.getAttribute("email")).thenReturn("patient@test.com");

        when(authutil.getProviderTypeFromRegistrationId("google")).thenReturn(AuthProviderType.GOOGLE);
        when(authutil.determineProviderIdFromOAuth2User(oAuth2User, "google")).thenReturn("google_sub_123");

        // Existing user found by email
        when(userRepository.findByUsername("patient@test.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Existing patient found
        Patient existingPatient = Patient.builder().id(1L).email("patient@test.com").name("Original Name").user(testUser).build();
        when(patientRepository.findById(1L)).thenReturn(Optional.of(existingPatient));

        when(authutil.generateAccessToken(any(User.class))).thenReturn("oauth_jwt_token");
        when(refreshTokenService.generateRefreshToken(any(User.class))).thenReturn("oauth_refresh_token");

        org.springframework.http.ResponseEntity<LoginResponseDto> response = authService.handleOAuth2LoginRequest(oAuth2User, "google");

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("oauth_jwt_token", response.getBody().getJwt());
        assertEquals(1L, response.getBody().getUserId());
        assertEquals("oauth_refresh_token", response.getBody().getRefreshToken());

        // Verify providerId and authProviderType were updated on the existing user (provider is not null)
        assertEquals("google_sub_123", testUser.getProviderId());
        assertEquals(AuthProviderType.GOOGLE, testUser.getAuthProviderType());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    void handleOAuth2LoginRequest_NewOAuthUser_RegistersAndReturnsTokens() {
        org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = mock(org.springframework.security.oauth2.core.user.OAuth2User.class);
        when(oAuth2User.getAttribute("name")).thenReturn("New Github User");
        when(oAuth2User.getAttribute("email")).thenReturn("newgithub@test.com");

        when(authutil.getProviderTypeFromRegistrationId("github")).thenReturn(AuthProviderType.GITHUB);
        when(authutil.determineProviderIdFromOAuth2User(oAuth2User, "github")).thenReturn("github_id_999");

        // Not found by email or provider
        when(userRepository.findByUsername("newgithub@test.com")).thenReturn(Optional.empty());
        when(userRepository.findByProviderIdAndAuthProviderType("github_id_999", AuthProviderType.GITHUB)).thenReturn(Optional.empty());

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });
        when(patientRepository.save(any(Patient.class))).thenReturn(new Patient());

        when(authutil.generateAccessToken(any(User.class))).thenReturn("new_oauth_jwt");
        when(refreshTokenService.generateRefreshToken(any(User.class))).thenReturn("new_oauth_refresh");

        org.springframework.http.ResponseEntity<LoginResponseDto> response = authService.handleOAuth2LoginRequest(oAuth2User, "github");

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("new_oauth_jwt", response.getBody().getJwt());
        assertEquals(2L, response.getBody().getUserId());
        assertEquals("new_oauth_refresh", response.getBody().getRefreshToken());

        verify(userRepository, times(1)).save(any(User.class));
        verify(patientRepository, times(1)).save(any(Patient.class));
    }
}
