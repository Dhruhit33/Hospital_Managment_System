package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.type.AuthProviderType;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.me.hospitalmanagement.entity.User;

//import java.lang.ScopedValue;
import java.util.Optional;


public interface UserRepository  extends JpaRepository<User,Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByProviderIdAndAuthProviderType(String providerId, AuthProviderType authProviderType);
    
    org.springframework.data.domain.Page<User> findByRolesContaining(com.example.me.hospitalmanagement.entity.type.RoleType role, org.springframework.data.domain.Pageable pageable);
}
