package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.entity.AuditLog;
import com.example.me.hospitalmanagement.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void logAction(Long userId, String action, String entityType, Long entityId) {
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }
}
