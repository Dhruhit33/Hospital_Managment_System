package com.example.me.hospitalmanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"doctor_id", "leaveDate"})
})
public class DoctorLeave extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @NotNull
    @Column(nullable = false)
    private LocalDate leaveDate;

    @Size(max = 255)
    private String reason;
}
