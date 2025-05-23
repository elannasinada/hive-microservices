package com.gl.hive.AuthenticationService.repository;

import com.gl.hive.AuthenticationService.model.entity.Roles;
import com.gl.hive.shared.lib.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RolesRepository extends JpaRepository<Roles, Long> {

    Optional<Roles> findByRole(Role role);

}