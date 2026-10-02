package com.example.me.hospitalmanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medical_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "appointment_id", unique = true, nullable = false)
    private Appointment appointment;

    @NotBlank
    @Size(max = 1000)
    @Column(nullable = false, length = 1000)
    private String diagnosis;

    @Size(max = 2000)
    @Column(length = 2000)
    private String notes;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "attachment_name")
    private String attachmentName;

    @Column(name = "attachment_type")
    private String attachmentType;

    @Column(name = "attachment_size")
    private String attachmentSize;

    @Lob
    @Column(name = "attachment_data", columnDefinition = "LONGTEXT")
    private String attachmentData;

    @OneToMany(mappedBy = "medicalRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Prescription> prescriptions = new ArrayList<>();
}
