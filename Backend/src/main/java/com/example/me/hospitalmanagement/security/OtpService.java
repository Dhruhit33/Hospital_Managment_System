package com.example.me.hospitalmanagement.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${notification.mail-from:noreply@hospital.com}")
    private String mailFrom;

    private static final long OTP_VALIDITY_SECONDS = 600; // 10 minutes
    private static final SecureRandom RANDOM = new SecureRandom();

    private static class OtpEntry {
        final String code;
        final Instant expiresAt;

        OtpEntry(String code, Instant expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }

        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private String buildKey(String email, OtpPurpose purpose) {
        return (email.trim().toLowerCase()) + ":" + purpose.name();
    }

    /**
     * Generates a 6-digit OTP, stores it, and sends it to the recipient email.
     */
    public String generateAndSendOtp(String email, OtpPurpose purpose) {
        String cleanEmail = email.trim().toLowerCase();
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plusSeconds(OTP_VALIDITY_SECONDS);

        otpStore.put(buildKey(cleanEmail, purpose), new OtpEntry(code, expiresAt));
        log.info("🔐 Generated CarePoint OTP for [{}:{}] -> {}", cleanEmail, purpose, code);

        sendOtpEmail(cleanEmail, code, purpose);
        return code;
    }

    /**
     * Verifies that the provided OTP matches and is not expired.
     * Consumes the OTP upon successful verification.
     */
    public boolean verifyOtp(String email, String code, OtpPurpose purpose) {
        if (email == null || code == null) return false;
        String key = buildKey(email, purpose);
        OtpEntry entry = otpStore.get(key);

        if (entry == null) {
            log.warn("No OTP found for key: {}", key);
            return false;
        }

        if (entry.isExpired()) {
            otpStore.remove(key);
            log.warn("OTP for key {} has expired", key);
            return false;
        }

        if (entry.code.equals(code.trim())) {
            otpStore.remove(key);
            log.info("✅ OTP successfully verified for [{}:{}]", email, purpose);
            return true;
        }

        log.warn("❌ Incorrect OTP entered for key: {}", key);
        return false;
    }

    @Async("notificationTaskExecutor")
    public void sendOtpEmail(String toEmail, String otp, OtpPurpose purpose) {
        String purposeText = purpose == OtpPurpose.SIGNUP
                ? "patient account registration"
                : "secure account sign in";

        try {
            if (mailSender == null) {
                log.warn("JavaMailSender is not configured; logged OTP [{}] for {}", otp, toEmail);
                return;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(toEmail);
            message.setSubject("CarePoint Health - Your Verification Code: " + otp);
            message.setText(String.format(
                    "Hello,\n\nYour one-time verification code for %s is:\n\n%s\n\nThis verification code is valid for 10 minutes.\nIf you did not initiate this request, please disregard this email.\n\nWarm regards,\nCarePoint Health Clinical Network",
                    purposeText,
                    otp
            ));

            mailSender.send(message);
            log.info("📧 Successfully sent OTP email to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to deliver OTP email to {}: {}. OTP remains: {}", toEmail, e.getMessage(), otp);
        }
    }
}
