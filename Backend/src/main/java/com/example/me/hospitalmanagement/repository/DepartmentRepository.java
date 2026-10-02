package com.example.me.hospitalmanagement.repository;

import com.example.me.hospitalmanagement.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    boolean existsByName(String name);

    @EntityGraph(attributePaths = {"headDoctor", "doctors"})
    Page<Department> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"headDoctor", "doctors"})
    Optional<Department> findById(Long id);
}