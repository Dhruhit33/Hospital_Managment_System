package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.entity.type.InsuranceStatus;
import com.example.me.hospitalmanagement.repository.InsuranceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class InsuranceExpiryJob {

    private final InsuranceRepository insuranceRepository;

    // Run every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void markExpiredInsurances() {
        log.info("Running InsuranceExpiryJob...");
        int count = insuranceRepository.updateExpiredInsurances(InsuranceStatus.EXPIRED, InsuranceStatus.ACTIVE, LocalDate.now());
        log.info("InsuranceExpiryJob completed. Marked {} insurances as EXPIRED.", count);
    }
}
