package com.example.me.hospitalmanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Builder
public class Department extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @OneToOne
    @ToString.Exclude
    private Doctor headDoctor;

    @ManyToMany
    @JoinTable(
            name = "my_dpt_doctor",
            joinColumns = @JoinColumn(name = "dpt_id"),
            inverseJoinColumns = @JoinColumn(name = "doctor_id")
    )
    @ToString.Exclude
    @Builder.Default
    private Set<Doctor> doctors = new HashSet<>();
}
