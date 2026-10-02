package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.entity.Patient;
import com.example.me.hospitalmanagement.entity.type.BloodGroup;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class PatientSpecification {

    public static Specification<Patient> withName(String name) {
        return (root, query, builder) -> {
            if (name == null || name.isEmpty()) return null;
            return builder.like(builder.lower(root.get("name")), "%" + name.toLowerCase() + "%");
        };
    }

    public static Specification<Patient> withBloodGroup(String bloodGroup) {
        return (root, query, builder) -> {
            if (bloodGroup == null || bloodGroup.isEmpty()) return null;
            return builder.equal(root.get("bloodGroup"), BloodGroup.valueOf(bloodGroup.toUpperCase()));
        };
    }

    public static Specification<Patient> withBornAfter(LocalDate bornAfter) {
        return (root, query, builder) -> {
            if (bornAfter == null) return null;
            return builder.greaterThan(root.get("birthDate"), bornAfter);
        };
    }
}
