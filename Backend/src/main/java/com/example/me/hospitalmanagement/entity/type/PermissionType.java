package com.example.me.hospitalmanagement.entity.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermissionType {
    PATIENT_READ("patient:read"),
    PATIENT_WRITE("patient:write"),
    APPOINTMENT_READ("appointment:read"),
    APPOINTMENT_WRITE("appointment:write"),
    APPOINTMENT_DELETE("appointment:delete"),
    USER_MANAGE("user:manage"),
    REPORT_VIEW("report:view"),
    RECORD_READ("record:read"),
    RECORD_WRITE("record:write"),
    BILL_READ("bill:read"),
    BILL_WRITE("bill:write");

    private final String permission;
}
