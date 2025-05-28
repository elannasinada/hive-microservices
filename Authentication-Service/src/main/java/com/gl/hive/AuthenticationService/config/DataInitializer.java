package com.gl.hive.AuthenticationService.config;

import com.gl.hive.AuthenticationService.model.entity.Roles;
import com.gl.hive.AuthenticationService.repository.RolesRepository;
import com.gl.hive.shared.lib.model.enums.Role;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initRoles(RolesRepository rolesRepository) {
        return args -> {
            // Only add the three main roles
            for (Role role : new Role[]{Role.ADMIN, Role.PROJECT_LEADER, Role.TEAM_MEMBER}) {
                rolesRepository.findByRole(role)
                        .orElseGet(() -> rolesRepository.save(Roles.builder().role(role).build()));
            }
        };
    }
}