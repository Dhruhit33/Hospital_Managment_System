package com.example.me.hospitalmanagement.entity;

import com.example.me.hospitalmanagement.entity.type.InsuranceStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Insurance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "policy_number", nullable = false, unique = true, length = 50)
    private String policyNumber;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String provider;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Min(0)
    @Max(100)
    @Column(name = "coverage_percent", nullable = false)
    @Builder.Default
    private Integer coveragePercent = 70;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InsuranceStatus status = InsuranceStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "insurance")
    @ToString.Exclude
    private Patient patient;
}
