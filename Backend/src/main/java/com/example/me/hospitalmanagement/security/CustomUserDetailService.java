package com.example.me.hospitalmanagement.security;

import com.example.me.hospitalmanagement.repository.PatientRepository;
import com.example.me.hospitalmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        return userRepository.findByUsername(identifier)
                .or(() -> patientRepository.findByEmail(identifier).map(com.example.me.hospitalmanagement.entity.Patient::getUser))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + identifier));
    }
}
