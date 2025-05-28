package com.gl.hive.AuthenticationService.repository;

import com.gl.hive.AuthenticationService.model.entity.Departments;
import com.gl.hive.shared.lib.model.enums.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DepartmentsRepository extends JpaRepository<Departments, Long> {
    Optional<Departments> findByDepartment(Department department);
} 