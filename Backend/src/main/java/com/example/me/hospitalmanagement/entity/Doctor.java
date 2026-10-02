package com.example.me.hospitalmanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor extends BaseEntity {
    @Id
    private Long id;

    @OneToOne
    @MapsId
    @ToString.Exclude
    private User user;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @Size(max = 200)
    @Column(length = 200)
    private String specialization;

    @NotBlank
    @Email
    @Size(max = 100)
    @Column(nullable = false, length = 100, unique = true)
    private String email;

    @jakarta.validation.constraints.PositiveOrZero
    @Column(name = "consultation_fee", precision = 10, scale = 2)
    private java.math.BigDecimal consultationFee;

    @OneToMany(mappedBy = "doctor")
    @ToString.Exclude
    @Builder.Default
    private List<Appointment> appointments = new ArrayList<>();

    @ManyToMany(mappedBy = "doctors")
    @ToString.Exclude
    @Builder.Default
    private Set<Department> departments = new HashSet<>();
}
