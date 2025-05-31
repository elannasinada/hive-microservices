package com.gl.hive.AuthenticationService.repository;

import com.gl.hive.AuthenticationService.model.entity.User;
import com.gl.hive.shared.lib.model.enums.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    
    Optional<User> findByUsername(String username);
    
    @Query("SELECT u FROM User u JOIN u.departments d WHERE d.department = :departmentName")
    List<User> findByDepartmentsName(@Param("departmentName") String departmentName);
    
    @Query("SELECT u FROM User u JOIN u.departments d WHERE d.department = :department")
    List<User> findByDepartmentsEnum(@Param("department") Department department);
    
    List<User> findByActiveTrue();
    
    List<User> findByActiveFalse();

}