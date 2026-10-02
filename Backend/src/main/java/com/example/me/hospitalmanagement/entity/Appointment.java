package com.example.me.hospitalmanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Builder
public class Appointment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime appointmentTime;

    @Size(max = 500)
    @Column(length = 500)
    private String reason;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    @ToString.Exclude
    private Patient patient;

    @NotNull
    @ManyToOne
    @JoinColumn(nullable = false)
    @ToString.Exclude
    private Doctor doctor;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private com.example.me.hospitalmanagement.entity.type.AppointmentStatus status = com.example.me.hospitalmanagement.entity.type.AppointmentStatus.BOOKED;

    @Column
    private Long cancelledBy;

    @Size(max = 300)
    @Column(length = 300)
    private String cancelReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "reminder_sent", nullable = false)
    @Builder.Default
    private boolean reminderSent = false;
}
