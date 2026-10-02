package com.example.me.hospitalmanagement.entity;

import com.example.me.hospitalmanagement.entity.type.BloodGroup;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@ToString
@Getter
@Setter
@Table(
        name = "patient",
        uniqueConstraints = {
                @UniqueConstraint(name = "unique_patient_email", columnNames = {"email"}),
                @UniqueConstraint(name = "unique_patient_name_birthdate", columnNames = {"name", "birth_date"})
        },
        indexes = {
                @Index(name = "Index_patient_birth_date", columnList = "birth_date")
        }
)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Patient extends BaseEntity implements org.springframework.data.domain.Persistable<Long> {
    @Id
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @Past
    @Column(name = "birth_date")
    private LocalDate birthDate;

    @NotBlank
    @Email
    @Column(nullable = false, length = 100)
    private String email;

    @Size(max = 20)
    @Column(length = 20)
    private String gender;

    @OneToOne
    @MapsId
    @ToString.Exclude
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_group")
    private BloodGroup bloodGroup;

    @Size(max = 500)
    @Column(length = 500)
    private String allergies;

    @jakarta.validation.constraints.Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Emergency contact must be a valid phone number")
    @Column(name = "emergency_contact")
    private String emergencyContact;

    @OneToOne(cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JoinColumn(name = "patient_insurance_id")
    @ToString.Exclude
    private Insurance insurance;

    @OneToMany(mappedBy = "patient", cascade = {CascadeType.REMOVE}, orphanRemoval = true)
    @ToString.Exclude
    @Builder.Default
    private List<Appointment> appointments = new ArrayList<>();

    @Transient
    @Builder.Default
    private boolean isNewEntity = true;

    @Override
    public boolean isNew() {
        return isNewEntity;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNewEntity = false;
    }
}
