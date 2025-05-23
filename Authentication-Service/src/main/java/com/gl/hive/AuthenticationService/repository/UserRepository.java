package com.gl.hive.AuthenticationService.repository;

import com.gl.hive.AuthenticationService.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

}