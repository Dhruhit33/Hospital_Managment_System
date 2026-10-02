package com.example.me.hospitalmanagement.service;

import com.example.me.hospitalmanagement.entity.Department;
import com.example.me.hospitalmanagement.entity.Doctor;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class DoctorSpecification {

    public static Specification<Doctor> withActiveDoctorRole() {
        return (root, query, builder) -> {
            Join<Doctor, com.example.me.hospitalmanagement.entity.User> userJoin = root.join("user", JoinType.INNER);
            Join<com.example.me.hospitalmanagement.entity.User, com.example.me.hospitalmanagement.entity.type.RoleType> rolesJoin = userJoin.join("roles", JoinType.INNER);
            return builder.equal(rolesJoin, com.example.me.hospitalmanagement.entity.type.RoleType.DOCTOR);
        };
    }

    public static Specification<Doctor> withName(String name) {
        return (root, query, builder) -> {
            if (name == null || name.isEmpty()) return null;
            return builder.like(builder.lower(root.get("name")), "%" + name.toLowerCase() + "%");
        };
    }

    public static Specification<Doctor> withSpecialization(String specialization) {
        return (root, query, builder) -> {
            if (specialization == null || specialization.isEmpty()) return null;
            return builder.like(builder.lower(root.get("specialization")), "%" + specialization.toLowerCase() + "%");
        };
    }

    public static Specification<Doctor> withDepartment(Long departmentId) {
        return (root, query, builder) -> {
            if (departmentId == null) return null;
            Join<Doctor, Department> departmentJoin = root.join("departments", JoinType.INNER);
            return builder.equal(departmentJoin.get("id"), departmentId);
        };
    }
    
    public static Specification<Doctor> fetchDepartments() {
        return (root, query, builder) -> {
            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("departments", JoinType.LEFT);
            }
            return null;
        };
    }
}
