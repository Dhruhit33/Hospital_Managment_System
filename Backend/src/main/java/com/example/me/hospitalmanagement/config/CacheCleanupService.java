package com.example.me.hospitalmanagement.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheCleanupService {

    private final CacheManager cacheManager;

    @Scheduled(fixedRate = 300000) // 5 minutes = 300,000 ms
    public void clearSlotsCache() {
        if (cacheManager != null) {
            Cache slotsCache = cacheManager.getCache("slots");
            if (slotsCache != null) {
                slotsCache.clear();
                log.debug("Cleared 'slots' cache on 5-minute TTL schedule");
            }
        }
    }
}
