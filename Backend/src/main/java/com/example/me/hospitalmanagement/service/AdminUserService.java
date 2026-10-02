package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.entity.type.RoleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Set;

public interface AdminUserService {
    Page<Object> getUsers(RoleType role, Pageable pageable);
    void updateRoles(Long userId, Set<RoleType> roles);
    void setEnabled(Long userId, boolean enabled);
    void createUser(com.example.me.hospitalmanagement.dto.CreateUserRequestDto dto);
}
