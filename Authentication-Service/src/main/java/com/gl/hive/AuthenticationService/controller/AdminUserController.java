package com.gl.hive.AuthenticationService.controller;

import com.gl.hive.AuthenticationService.model.entity.User;
import com.gl.hive.AuthenticationService.model.entity.Roles;
import com.gl.hive.AuthenticationService.model.entity.Departments;
import com.gl.hive.AuthenticationService.repository.UserRepository;
import com.gl.hive.AuthenticationService.repository.RolesRepository;
import com.gl.hive.AuthenticationService.repository.DepartmentsRepository;
import com.gl.hive.AuthenticationService.service.UserService;
import com.gl.hive.shared.lib.model.enums.Role;
import com.gl.hive.shared.lib.model.enums.Department;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserRepository userRepository;
    private final RolesRepository rolesRepository;
    private final DepartmentsRepository departmentsRepository;
    private final UserService userService;    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_PROJECT_LEADER')")
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
        }    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<User> getUserById(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long userId, @RequestBody UpdateUserRequest updateRequest) {
        return userRepository.findById(userId)
                .map(user -> {
                    // Update username if provided
                    if (updateRequest.getUsername() != null && !updateRequest.getUsername().trim().isEmpty()) {
                        user.setUsername(updateRequest.getUsername());
                    }
                    
                    // Update email if provided
                    if (updateRequest.getEmail() != null && !updateRequest.getEmail().trim().isEmpty()) {
                        user.setEmail(updateRequest.getEmail());
                    }
                    
                    // Update department if provided
                    if (updateRequest.getDepartments() != null && !updateRequest.getDepartments().isEmpty()) {
                        Set<Departments> departmentEntities = new HashSet<>();
                        for (UpdateUserRequest.DepartmentInfo deptInfo : updateRequest.getDepartments()) {
                            try {
                                Department departmentEnum = Department.valueOf(deptInfo.getDepartment().toUpperCase());
                                Optional<Departments> departmentEntity = departmentsRepository.findByDepartment(departmentEnum);
                                if (departmentEntity.isPresent()) {
                                    departmentEntities.add(departmentEntity.get());
                                } else {
                                    log.warn("Department not found in database: {}", deptInfo.getDepartment());
                                }
                            } catch (IllegalArgumentException e) {
                                log.error("Invalid department: {}", deptInfo.getDepartment());
                            }
                        }
                        user.setDepartments(departmentEntities);
                    }
                    
                    User savedUser = userRepository.save(user);
                    log.info("Updated user {}: username={}, email={}, departments={}", 
                            userId, savedUser.getUsername(), savedUser.getEmail(), savedUser.getDepartments());
                    return ResponseEntity.ok(savedUser);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Inner class for update request
    public static class UpdateUserRequest {
        private String username;
        private String email;
        private List<DepartmentInfo> departments;

        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public List<DepartmentInfo> getDepartments() { return departments; }
        public void setDepartments(List<DepartmentInfo> departments) { this.departments = departments; }

        public static class DepartmentInfo {
            private String department;
            
            public String getDepartment() { return department; }
            public void setDepartment(String department) { this.department = department; }
        }
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

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest createRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("Admin {} creating new user: {}", 
                authentication != null ? authentication.getName() : "Unknown", createRequest.getUsername());

        try {
            // Check if user already exists
            if (userRepository.findByEmail(createRequest.getEmail()).isPresent()) {
                log.warn("User with email {} already exists", createRequest.getEmail());
                return ResponseEntity.badRequest().build();
            }
            
            if (userRepository.findByUsername(createRequest.getUsername()).isPresent()) {
                log.warn("User with username {} already exists", createRequest.getUsername());
                return ResponseEntity.badRequest().build();
            }

            // Create new user
            User newUser = User.builder()
                    .username(createRequest.getUsername())
                    .email(createRequest.getEmail())
                    .password(createRequest.getPassword())
                    .active(true)
                    .build();

            // Set department if provided
            if (createRequest.getDepartment() != null && !createRequest.getDepartment().trim().isEmpty()) {
                try {
                    Department departmentEnum = Department.valueOf(createRequest.getDepartment().toUpperCase());
                    Optional<Departments> departmentEntity = departmentsRepository.findByDepartment(departmentEnum);
                    if (departmentEntity.isPresent()) {
                        Set<Departments> departments = new HashSet<>();
                        departments.add(departmentEntity.get());
                        newUser.setDepartments(departments);
                    } else {
                        log.warn("Department not found in database: {}", createRequest.getDepartment());
                    }
                } catch (IllegalArgumentException e) {
                    log.error("Invalid department: {}", createRequest.getDepartment());
                    return ResponseEntity.badRequest().build();
                }
            }

            // Set role if provided, otherwise defaults to TEAM_MEMBER
            if (createRequest.getRole() != null && !createRequest.getRole().trim().isEmpty()) {
                try {
                    String cleanRole = createRequest.getRole().startsWith("ROLE_") ? 
                        createRequest.getRole().substring(5) : createRequest.getRole();
                    Role roleEnum = Role.valueOf(cleanRole.toUpperCase());
                    Optional<Roles> roleEntity = rolesRepository.findByRole(roleEnum);
                    if (roleEntity.isPresent()) {
                        Set<Roles> roles = new HashSet<>();
                        roles.add(roleEntity.get());
                        newUser.setRoles(roles);
                    } else {
                        log.warn("Role not found in database: {}", roleEnum);
                    }
                } catch (IllegalArgumentException e) {
                    log.error("Invalid role: {}", createRequest.getRole());
                    return ResponseEntity.badRequest().build();
                }
            }

            // Use UserService to create the user (handles password encoding and defaults)
            User savedUser = userService.createUser(newUser);
            log.info("Successfully created user {} by admin {}", savedUser.getUsername(), 
                    authentication != null ? authentication.getName() : "Unknown");
            
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            log.error("Error creating user: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Inner class for create user request
    public static class CreateUserRequest {
        private String username;
        private String email;
        private String password;
        private String department;
        private String role;

        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}