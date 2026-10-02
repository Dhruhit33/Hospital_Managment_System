package com.example.me.hospitalmanagement.security;

import com.example.me.hospitalmanagement.dto.LoginRequestDto;
import com.example.me.hospitalmanagement.dto.LoginResponseDto;
import com.example.me.hospitalmanagement.dto.SignUpRequestDto;
import com.example.me.hospitalmanagement.dto.SignupResponseDto;
import com.example.me.hospitalmanagement.dto.VerifyLoginOtpRequestDto;
import com.example.me.hospitalmanagement.entity.Doctor;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.type.AuthProviderType;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.error.exception.BusinessRuleException;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.DoctorRepository;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import com.example.me.hospitalmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final AuthUtil authutil;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final RefreshTokenService refreshTokenService;
    private final OtpService otpService;

    public String resolveUserName(User user) {
        if (user == null) return "CarePoint User";
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        if (user.getId() != null) {
            if (patientRepository != null) {
                var patientOpt = patientRepository.findById(user.getId());
                if (patientOpt.isPresent() && patientOpt.get().getName() != null && !patientOpt.get().getName().isBlank()) {
                    return patientOpt.get().getName();
                }
            }
            if (doctorRepository != null) {
                var docOpt = doctorRepository.findById(user.getId());
                if (docOpt.isPresent() && docOpt.get().getName() != null && !docOpt.get().getName().isBlank()) {
                    return docOpt.get().getName();
                }
            }
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().split("@")[0];
        }
        return "CarePoint User";
    }

    public String resolveUserEmail(User user) {
        if (user == null) return null;
        if (user.getUsername() != null && user.getUsername().contains("@")) {
            return user.getUsername();
        }
        if (user.getId() != null) {
            if (patientRepository != null) {
                var patientOpt = patientRepository.findById(user.getId());
                if (patientOpt.isPresent() && patientOpt.get().getEmail() != null && !patientOpt.get().getEmail().isBlank()) {
                    return patientOpt.get().getEmail();
                }
            }
            if (doctorRepository != null) {
                var docOpt = doctorRepository.findById(user.getId());
                if (docOpt.isPresent() && docOpt.get().getEmail() != null && !docOpt.get().getEmail().isBlank()) {
                    return docOpt.get().getEmail();
                }
            }
        }
        return user.getUsername();
    }

    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequestDto.getUsername(),
                        loginRequestDto.getPassword()
                )
        );

        User user = (User) authentication.getPrincipal();
        String resolvedName = resolveUserName(user);
        if (user.getName() == null && resolvedName != null) {
            user.setName(resolvedName);
            userRepository.save(user);
        }

        String userEmail = resolveUserEmail(user);
        if (userEmail == null || userEmail.isBlank()) {
            userEmail = user.getUsername();
        }

        String token = null;
        String refreshToken = null;
        if (authutil != null) {
            token = authutil.generateAccessToken(user);
        }
        if (refreshTokenService != null) {
            refreshToken = refreshTokenService.generateRefreshToken(user);
        }

        // Generate and send 6-digit OTP to user's verified email address if configured
        if (otpService != null) {
            otpService.generateAndSendOtp(userEmail, OtpPurpose.LOGIN);
        }

        return LoginResponseDto.builder()
                .jwt(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .requiresOtp(true)
                .username(user.getUsername())
                .name(resolvedName)
                .message("A 6-digit verification code has been dispatched to " + userEmail)
                .build();
    }

    public LoginResponseDto verifyLoginOtp(VerifyLoginOtpRequestDto dto) {
        String identifier = dto.getEmail().trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> patientRepository.findByEmail(identifier).map(Patient::getUser))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + identifier));

        String userEmail = resolveUserEmail(user);
        boolean valid = otpService.verifyOtp(userEmail, dto.getOtp(), OtpPurpose.LOGIN);
        if (!valid) {
            throw new BadCredentialsException("Invalid or expired verification code. Please check your email or resend.");
        }

        String resolvedName = resolveUserName(user);
        String token = authutil.generateAccessToken(user);
        String refreshToken = refreshTokenService.generateRefreshToken(user);

        Set<String> roleStrings = user.getRoles() != null
                ? user.getRoles().stream().map(Enum::name).collect(Collectors.toSet())
                : Set.of("PATIENT");

        return new LoginResponseDto(token, user.getId(), refreshToken, user.getUsername(), resolvedName, roleStrings);
    }

    public void resendLoginOtp(String identifier) {
        String cleanIdentifier = identifier.trim();
        User user = userRepository.findByUsername(cleanIdentifier)
                .or(() -> patientRepository.findByEmail(cleanIdentifier).map(Patient::getUser))
                .orElseThrow(() -> new ResourceNotFoundException("No account found with identifier: " + cleanIdentifier));
        String userEmail = resolveUserEmail(user);
        otpService.generateAndSendOtp(userEmail, OtpPurpose.LOGIN);
    }

    public void sendSignupOtp(String email) {
        String cleanEmail = email.trim().toLowerCase();
        if (patientRepository.findByEmail(cleanEmail).isPresent() || userRepository.findByUsername(cleanEmail).isPresent()) {
            throw new DuplicateResourceException("An account with email " + cleanEmail + " is already registered.");
        }
        otpService.generateAndSendOtp(cleanEmail, OtpPurpose.SIGNUP);
    }

    @Transactional
    public User signUpInternal(SignUpRequestDto signupRequestDto, AuthProviderType authProviderType, String providerId) {
        String cleanUsername = signupRequestDto.getUsername().trim();
        String cleanEmail = signupRequestDto.getEmail() != null && !signupRequestDto.getEmail().isBlank()
                ? signupRequestDto.getEmail().trim().toLowerCase()
                : cleanUsername.toLowerCase();

        if (userRepository.findByUsername(cleanUsername).isPresent()) {
            throw new DuplicateResourceException("Username '" + cleanUsername + "' is already taken. Please pick another username.");
        }

        if (patientRepository.findByEmail(cleanEmail).isPresent()) {
            throw new DuplicateResourceException("An account with email '" + cleanEmail + "' is already registered.");
        }

        // Validate OTP for email signups when provided
        if (authProviderType == AuthProviderType.EMAIL && signupRequestDto.getOtp() != null && !signupRequestDto.getOtp().isBlank()) {
            if (otpService != null) {
                boolean valid = otpService.verifyOtp(cleanEmail, signupRequestDto.getOtp(), OtpPurpose.SIGNUP);
                if (!valid) {
                    throw new BusinessRuleException("Invalid or expired verification code. Please check your email or request a new code.");
                }
            }
        }

        String resolvedName = signupRequestDto.getName() != null && !signupRequestDto.getName().isBlank()
                ? signupRequestDto.getName().trim()
                : cleanUsername;

        User newUser = User.builder()
                .username(cleanUsername)
                .name(resolvedName)
                .providerId(providerId)
                .authProviderType(authProviderType)
                .roles(Set.of(RoleType.PATIENT))
                .build();

        if (authProviderType == AuthProviderType.EMAIL) {
            newUser.setPassword(passwordEncoder.encode(signupRequestDto.getPassword()));
        }

        User savedUser = userRepository.save(newUser);

        Patient patient = Patient.builder()
                .id(savedUser.getId())
                .name(resolvedName)
                .email(cleanEmail)
                .gender(signupRequestDto.getGender() != null && !signupRequestDto.getGender().isBlank() ? signupRequestDto.getGender() : "Male")
                .bloodGroup(signupRequestDto.getBloodGroup() != null ? signupRequestDto.getBloodGroup() : com.example.me.hospitalmanagement.entity.type.BloodGroup.O)
                .birthDate(java.time.LocalDate.of(2000, 1, 1))
                .user(savedUser)
                .isNewEntity(true)
                .build();

        patientRepository.save(patient);
        return savedUser;
    }

    @Transactional
    public SignupResponseDto signup(SignUpRequestDto signupRequestDto) {
        User user = signUpInternal(signupRequestDto, AuthProviderType.EMAIL, null);
        return new SignupResponseDto(user.getId(), user.getUsername());
    }

    @Transactional
    public ResponseEntity<LoginResponseDto> handleOAuth2LoginRequest(OAuth2User oAuth2User, String registrationId) {
        String name = oAuth2User.getAttribute("name");
        AuthProviderType authProviderType = authutil.getProviderTypeFromRegistrationId(registrationId);
        String providerId = authutil.determineProviderIdFromOAuth2User(oAuth2User, registrationId);

        String email = oAuth2User.getAttribute("email");
        if (email == null || email.isBlank()) {
            email = authutil.determineUsernameFromOAuth2User(oAuth2User, registrationId, providerId);
        }

        String cleanEmail = (email != null && !email.isBlank()) ? email.trim() : null;

        // 1. Check if user already exists with this email (by username, patient email, or doctor email)
        User existingUser = null;
        if (cleanEmail != null) {
            existingUser = userRepository.findByUsername(cleanEmail)
                    .or(() -> patientRepository.findByEmail(cleanEmail).map(Patient::getUser))
                    .or(() -> doctorRepository.findByEmail(cleanEmail).map(Doctor::getUser))
                    .orElse(null);
        }

        // 2. If not found by email, check if user exists with this providerId and provider type
        if (existingUser == null && providerId != null && !providerId.isBlank()) {
            existingUser = userRepository.findByProviderIdAndAuthProviderType(providerId, authProviderType).orElse(null);
        }

        User user;
        String resolvedDisplayName = name != null && !name.isBlank() ? name.trim() : (cleanEmail != null ? cleanEmail.split("@")[0] : "OAuth User");

        if (existingUser != null) {
            user = existingUser;
            if (user.getName() == null || user.getName().isBlank()) {
                user.setName(resolvedDisplayName);
            }
            user.setProviderId(providerId);
            user.setAuthProviderType(authProviderType);
            user = userRepository.save(user);

            // Ensure patient profile exists and has email if the user is a PATIENT
            if (user.getRoles() != null && user.getRoles().contains(RoleType.PATIENT)) {
                Patient patient = patientRepository.findById(user.getId()).orElse(null);
                if (patient == null && cleanEmail != null) {
                    patient = patientRepository.findByEmail(cleanEmail).orElse(null);
                }

                if (patient != null) {
                    patient.setUser(user);
                    if (cleanEmail != null && (patient.getEmail() == null || patient.getEmail().isBlank())) {
                        patient.setEmail(cleanEmail);
                    }
                    if (patient.getName() == null || patient.getName().isBlank()) {
                        patient.setName(resolvedDisplayName);
                    }
                    patientRepository.save(patient);
                } else {
                    // Check once more by email to prevent duplicate email constraint violation
                    Optional<Patient> existingEmailPatient = cleanEmail != null ? patientRepository.findByEmail(cleanEmail) : Optional.empty();
                    if (existingEmailPatient.isPresent()) {
                        Patient p = existingEmailPatient.get();
                        p.setUser(user);
                        patientRepository.save(p);
                    } else {
                        Patient newP = Patient.builder()
                                .id(user.getId())
                                .user(user)
                                .name(resolvedDisplayName)
                                .email(cleanEmail != null ? cleanEmail : user.getUsername())
                                .gender("Male")
                                .bloodGroup(com.example.me.hospitalmanagement.entity.type.BloodGroup.O)
                                .birthDate(java.time.LocalDate.of(2000, 1, 1))
                                .isNewEntity(true)
                                .build();
                        patientRepository.save(newP);
                    }
                }
            }
        } else {
            // Brand new user registration via OAuth2
            String targetEmail = cleanEmail != null ? cleanEmail : (providerId + "@" + registrationId.toLowerCase() + ".local");

            // Double check if a patient with targetEmail exists already in patient table
            Optional<Patient> existingPatientOpt = cleanEmail != null ? patientRepository.findByEmail(cleanEmail) : Optional.empty();

            if (existingPatientOpt.isPresent()) {
                Patient existingPatient = existingPatientOpt.get();
                if (existingPatient.getUser() != null) {
                    user = existingPatient.getUser();
                    user.setProviderId(providerId);
                    user.setAuthProviderType(authProviderType);
                    user = userRepository.save(user);
                } else {
                    User newUser = User.builder()
                            .username(targetEmail)
                            .name(resolvedDisplayName)
                            .providerId(providerId)
                            .authProviderType(authProviderType)
                            .roles(Set.of(RoleType.PATIENT))
                            .enabled(true)
                            .build();
                    user = userRepository.save(newUser);
                    existingPatient.setUser(user);
                    patientRepository.save(existingPatient);
                }
            } else {
                User newUser = User.builder()
                        .username(targetEmail)
                        .name(resolvedDisplayName)
                        .providerId(providerId)
                        .authProviderType(authProviderType)
                        .roles(Set.of(RoleType.PATIENT))
                        .enabled(true)
                        .build();
                user = userRepository.save(newUser);

                Patient newPatient = Patient.builder()
                        .id(user.getId())
                        .user(user)
                        .name(resolvedDisplayName)
                        .email(targetEmail)
                        .gender("Male")
                        .bloodGroup(com.example.me.hospitalmanagement.entity.type.BloodGroup.O)
                        .birthDate(java.time.LocalDate.of(2000, 1, 1))
                        .isNewEntity(true)
                        .build();
                patientRepository.save(newPatient);
            }
        }

        String token = authutil.generateAccessToken(user);
        String refreshToken = refreshTokenService.generateRefreshToken(user);

        Set<String> roleStrings = user.getRoles() != null
                ? user.getRoles().stream().map(Enum::name).collect(Collectors.toSet())
                : Set.of("PATIENT");

        LoginResponseDto loginResponseDto = new LoginResponseDto(token, user.getId(), refreshToken, user.getUsername(), user.getName(), roleStrings);
        return ResponseEntity.ok(loginResponseDto);
    }
}
