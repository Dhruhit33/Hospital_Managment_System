package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.entity.type.PermissionType;
import com.example.me.hospitalmanagement.entity.type.RoleType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.example.me.hospitalmanagement.entity.type.PermissionType.*;
import static com.example.me.hospitalmanagement.entity.type.RoleType.*;

public class RolePermissionMapping {

    private static final Map<RoleType, Set<PermissionType>> map = Map.of(
            PATIENT,Set.of(PATIENT_WRITE,APPOINTMENT_READ,APPOINTMENT_WRITE, RECORD_READ, BILL_READ, BILL_WRITE),
            DOCTOR,Set.of(APPOINTMENT_DELETE,APPOINTMENT_WRITE,APPOINTMENT_READ,PATIENT_READ, RECORD_READ, RECORD_WRITE),
            ADMIN,Set.of(PATIENT_READ,PATIENT_WRITE,APPOINTMENT_DELETE,APPOINTMENT_READ,APPOINTMENT_WRITE,USER_MANAGE,REPORT_VIEW, RECORD_READ, BILL_READ, BILL_WRITE)
    );

    public static Set<SimpleGrantedAuthority> getAuthoritiesForEach(RoleType role) {
        return map.get(role).stream()
                .map(permission -> new SimpleGrantedAuthority(permission.getPermission()))
                .collect(Collectors.toSet());
    }
}
