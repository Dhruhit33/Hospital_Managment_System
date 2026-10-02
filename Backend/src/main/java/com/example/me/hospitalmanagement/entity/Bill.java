package com.example.me.hospitalmanagement.entity;

import com.example.me.hospitalmanagement.entity.type.BillStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bill")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "appointment_id", unique = true, nullable = false)
    private Appointment appointment;

    @Column(name = "consultation_fee", precision = 10, scale = 2, nullable = false)
    private BigDecimal consultationFee;

    @Column(name = "medicine_charges", precision = 10, scale = 2, nullable = false)
    private BigDecimal medicineCharges;

    @Column(name = "other_charges", precision = 10, scale = 2, nullable = false)
    private BigDecimal otherCharges;

    @Column(name = "insurance_covered", precision = 10, scale = 2, nullable = false)
    private BigDecimal insuranceCovered;

    @Column(name = "total_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "patient_payable", precision = 10, scale = 2, nullable = false)
    private BigDecimal patientPayable;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BillStatus status = BillStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();
}
