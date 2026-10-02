package com.example.me.hospitalmanagement.service.impl;

import com.example.me.hospitalmanagement.entity.User;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import com.example.me.hospitalmanagement.error.exception.BusinessRuleException;
import com.example.me.hospitalmanagement.error.exception.ResourceNotFoundException;
import com.example.me.hospitalmanagement.repository.UserRepository;
import com.example.me.hospitalmanagement.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import com.example.me.hospitalmanagement.entity.Doctor;
import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.type.AuthProviderType;
import com.example.me.hospitalmanagement.error.exception.DuplicateResourceException;
import com.example.me.hospitalmanagement.repository.DoctorRepository;
import com.example.me.hospitalmanagement.repository.PatientRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${admin.username:admin@hospital.com}")
    private String adminUsername;

    private boolean isPredefinedAdmin(User user) {
        if (user == null) return false;
        return (user.getUsername() != null && user.getUsername().equalsIgnoreCase(adminUsername))
                || Long.valueOf(1L).equals(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Object> getUsers(RoleType role, Pageable pageable) {
        Page<User> users;
        if (role != null) {
            users = userRepository.findByRolesContaining(role, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        
        return users.map(user -> {
            // Auto clean if existing user had both Doctor/Admin and Patient
            if ((user.getRoles().contains(RoleType.DOCTOR) || user.getRoles().contains(RoleType.ADMIN))
                    && user.getRoles().contains(RoleType.PATIENT)) {
                user.getRoles().remove(RoleType.PATIENT);
                userRepository.save(user);
            }

            var dto = new java.util.HashMap<String, Object>();
            dto.put("id", user.getId());
            dto.put("username", user.getUsername());
            String resolvedName = user.getName();
            String specialization = null;
            if (user.getRoles().contains(RoleType.DOCTOR)) {
                var dOpt = doctorRepository.findById(user.getId());
                if (dOpt.isPresent()) {
                    specialization = dOpt.get().getSpecialization();
                    if (resolvedName == null || resolvedName.isBlank()) {
                        resolvedName = dOpt.get().getName();
                    }
                }
            } else {
                // If user is not a doctor, ensure specialization is cleared in doctor entity
                var dOpt = doctorRepository.findById(user.getId());
                if (dOpt.isPresent() && dOpt.get().getSpecialization() != null) {
                    Doctor d = dOpt.get();
                    d.setSpecialization(null);
                    doctorRepository.save(d);
                }
            }
            if (resolvedName == null || resolvedName.isBlank()) {
                var pOpt = patientRepository.findById(user.getId());
                if (pOpt.isPresent()) {
                    resolvedName = pOpt.get().getName();
                } else {
                    resolvedName = user.getUsername().split("@")[0];
                }
            }
            dto.put("name", resolvedName);
            dto.put("specialization", specialization);
            dto.put("roles", user.getRoles());
            dto.put("enabled", user.isEnabled());
            dto.put("isPredefinedAdmin", isPredefinedAdmin(user));
            return dto;
        });
    }

    private User getCurrentAuthenticatedUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof User u) {
            return u;
        } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails ud) {
            return userRepository.findByUsername(ud.getUsername()).orElse(null);
        } else if (principal instanceof String username) {
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(
            evict = {
                @org.springframework.cache.annotation.CacheEvict(cacheNames = "doctors", allEntries = true),
                @org.springframework.cache.annotation.CacheEvict(cacheNames = "departments", allEntries = true)
            }
    )
    public void updateRoles(Long userId, Set<RoleType> roles) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User currentUser = getCurrentAuthenticatedUser();

        // 1. Cannot remove own ADMIN role
        if (currentUser != null && user.getId().equals(currentUser.getId()) && !roles.contains(RoleType.ADMIN) && user.getRoles().contains(RoleType.ADMIN)) {
            throw new BusinessRuleException("An admin cannot remove their own ADMIN role");
        }

        // 2. Predefined Main Admin cannot be removed or demoted
        if (isPredefinedAdmin(user) && !roles.contains(RoleType.ADMIN)) {
            throw new BusinessRuleException("The predefined Main Admin cannot be removed or demoted");
        }

        // 3. User Admin cannot remove or demote other Admins
        if (user.getRoles().contains(RoleType.ADMIN) && !roles.contains(RoleType.ADMIN)) {
            if (currentUser == null || !isPredefinedAdmin(currentUser)) {
                throw new BusinessRuleException("User Admins cannot remove or demote other administrators. Only the predefined Main Admin has this authority.");
            }
        }

        // AUTO-REMOVE PATIENT ROLE IF DOCTOR OR ADMIN ROLE IS ASSIGNED
        Set<RoleType> updatedRoles = new java.util.HashSet<>(roles);
        if (updatedRoles.contains(RoleType.DOCTOR) || updatedRoles.contains(RoleType.ADMIN)) {
            updatedRoles.remove(RoleType.PATIENT);
        }
        if (updatedRoles.isEmpty()) {
            updatedRoles.add(RoleType.PATIENT);
        }

        user.setRoles(updatedRoles);
        userRepository.save(user);

        // If granted DOCTOR role, ensure Doctor clinical entity exists
        if (updatedRoles.contains(RoleType.DOCTOR) && !doctorRepository.existsById(user.getId())) {
            String docName = user.getUsername().split("@")[0];
            String docEmail = user.getUsername();
            var patientOpt = patientRepository.findById(user.getId());
            if (patientOpt.isPresent()) {
                String pName = patientOpt.get().getName();
                docName = pName.toLowerCase().startsWith("dr.") ? pName : "Dr. " + pName;
                if (patientOpt.get().getEmail() != null) {
                    docEmail = patientOpt.get().getEmail();
                }
            } else {
                docName = "Dr. " + docName;
            }

            Doctor doctor = Doctor.builder()
                    .user(user)
                    .name(docName)
                    .specialization("General Physician")
                    .email(docEmail)
                    .build();
            doctorRepository.save(doctor);
        } else if (!updatedRoles.contains(RoleType.DOCTOR)) {
            // When converting from DOCTOR to PATIENT, clear specialization and detach departments
            var docOpt = doctorRepository.findById(user.getId());
            if (docOpt.isPresent()) {
                Doctor doc = docOpt.get();
                doc.setSpecialization(null);
                for (var dept : new java.util.ArrayList<>(doc.getDepartments())) {
                    dept.getDoctors().remove(doc);
                }
                doc.getDepartments().clear();
                doctorRepository.save(doc);
            }
        }

        // If user has PATIENT role, ensure Patient entity exists
        if (updatedRoles.contains(RoleType.PATIENT) && !patientRepository.existsById(user.getId())) {
            Patient patient = Patient.builder()
                    .user(user)
                    .name(user.getUsername().split("@")[0])
                    .email(user.getUsername())
                    .build();
            patientRepository.save(patient);
        }
    }

    @Override
    @Transactional
    public void setEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User currentUser = getCurrentAuthenticatedUser();

        if (currentUser != null && user.getId().equals(currentUser.getId()) && !enabled) {
            throw new BusinessRuleException("An admin cannot disable themselves");
        }

        // Predefined Main Admin cannot be disabled
        if (isPredefinedAdmin(user) && !enabled) {
            throw new BusinessRuleException("The predefined Main Admin account cannot be disabled");
        }

        // User Admin cannot disable other admins
        if (user.getRoles().contains(RoleType.ADMIN) && !enabled) {
            if (currentUser == null || !isPredefinedAdmin(currentUser)) {
                throw new BusinessRuleException("User Admins cannot disable other administrators. Only the predefined Main Admin has this authority.");
            }
        }

        user.setEnabled(enabled);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void createUser(com.example.me.hospitalmanagement.dto.CreateUserRequestDto dto) {
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new DuplicateResourceException("User already exists with username: " + dto.getUsername());
        }

        User newUser = User.builder()
                .username(dto.getUsername().trim())
                .name(dto.getName() != null && !dto.getName().isBlank() ? dto.getName().trim() : dto.getUsername().trim().split("@")[0])
                .password(passwordEncoder.encode(dto.getPassword()))
                .authProviderType(AuthProviderType.EMAIL)
                .roles(Set.of(dto.getRole()))
                .enabled(true)
                .build();

        userRepository.save(newUser);

        if (dto.getRole() == RoleType.DOCTOR) {
            Doctor doctor = Doctor.builder()
                    .user(newUser)
                    .name(dto.getName().trim().toLowerCase().startsWith("dr.") ? dto.getName().trim() : "Dr. " + dto.getName().trim())
                    .specialization(dto.getSpecialization() != null && !dto.getSpecialization().isBlank() ? dto.getSpecialization().trim() : "General Physician")
                    .email(dto.getUsername().trim())
                    .build();
            doctorRepository.save(doctor);
        } else {
            Patient patient = Patient.builder()
                    .user(newUser)
                    .name(dto.getName().trim())
                    .email(dto.getUsername().trim())
                    .build();
            patientRepository.save(patient);
        }
    }
}
