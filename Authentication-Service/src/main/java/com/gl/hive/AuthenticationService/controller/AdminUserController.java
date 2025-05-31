package com.gl.hive.AuthenticationService.controller;

import com.gl.hive.AuthenticationService.model.entity.User;
import com.gl.hive.AuthenticationService.model.entity.Roles;
import com.gl.hive.AuthenticationService.repository.UserRepository;
import com.gl.hive.AuthenticationService.repository.RolesRepository;
import com.gl.hive.shared.lib.model.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserRepository userRepository;
    private final RolesRepository rolesRepository;    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<User> getAllUsers() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            log.info("Accessing /api/v1/admin/users. User: {}, Authorities: {}", authentication.getName(), authentication.getAuthorities());
        } else {
            log.info("Accessing /api/v1/admin/users. No authentication found.");
        }

        List<User> users = userRepository.findAll();
        log.info("Returning {} users from /api/v1/admin/users: {}", users.size(), users);
        return users;
    }    @GetMapping("/by-department")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<User> getUsersByDepartment(@RequestParam String department) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("Accessing /api/v1/admin/users/by-department. User: {}, Department: {}", 
                authentication != null ? authentication.getName() : "Unknown", department);

        try {
            // Convert string department to enum
            com.gl.hive.shared.lib.model.enums.Department departmentEnum = 
                com.gl.hive.shared.lib.model.enums.Department.valueOf(department.toUpperCase());
            
            List<User> users = userRepository.findByDepartmentsEnum(departmentEnum);
            log.info("Returning {} users from department '{}': {}", users.size(), department, users);
            return users;
        } catch (IllegalArgumentException e) {
            log.error("Invalid department: {}", department);
            return List.of(); // Return empty list for invalid department
        }
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<User> getUserById(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long userId, @RequestBody User updatedUser) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setUsername(updatedUser.getUsername());
                    user.setEmail(updatedUser.getEmail());
                    user.setDepartments(updatedUser.getDepartments());
                    userRepository.save(user);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{userId}/activate")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<User> toggleActivation(@PathVariable Long userId, @RequestParam boolean active) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setActive(active);
                    userRepository.save(user);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{userId}/role")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<User> changeUserRole(@PathVariable Long userId, @RequestParam String role) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        
        // Convert string role to enum
        Role roleEnum;
        try {
            // Handle both "ROLE_ADMIN" and "ADMIN" formats
            String cleanRole = role.startsWith("ROLE_") ? role.substring(5) : role;
            roleEnum = Role.valueOf(cleanRole.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.error("Invalid role: {}", role);
            return ResponseEntity.badRequest().build();
        }
          Optional<Roles> newRole = rolesRepository.findByRole(roleEnum);
        if (newRole.isPresent()) {
            user.getRoles().clear();
            user.getRoles().add(newRole.get());
            userRepository.save(user);
            log.info("Updated user {} role to {}", userId, roleEnum);
            return ResponseEntity.ok(user);
        } else {
            log.error("Role not found in database: {}", roleEnum);
            return ResponseEntity.status(400).build();
        }
    }
}