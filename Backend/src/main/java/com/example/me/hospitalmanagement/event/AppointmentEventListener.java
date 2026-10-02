package com.example.me.hospitalmanagement.event;

import com.example.me.hospitalmanagement.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentEventListener {

    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAppointmentBooked(AppointmentBookedEvent event) {
        log.debug("Transaction committed for appointment booking #{}, dispatching notification", event.getAppointment().getId());
        notificationService.sendAppointmentBooked(event.getAppointment());
    }
}
