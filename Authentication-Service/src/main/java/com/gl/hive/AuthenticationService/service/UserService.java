package com.gl.hive.AuthenticationService.service;

import com.gl.hive.AuthenticationService.model.entity.Roles;
import com.gl.hive.AuthenticationService.model.entity.User;
import com.gl.hive.AuthenticationService.repository.RolesRepository;
import com.gl.hive.AuthenticationService.repository.UserRepository;
import com.gl.hive.shared.lib.model.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final RolesRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(User user) {
        try {
            log.info("Creating new user: {}", user.getUsername());

            // Encode password
            if (user.getPassword() != null) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            }            // Set default role if none specified
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                Optional<Roles> defaultRole = roleRepository.findByRole(Role.TEAM_MEMBER);
                if (defaultRole.isPresent()) {
                    user.setRoles(Set.of(defaultRole.get()));
                }
            }
              // Set default active status
            user.setActive(true);

            User savedUser = userRepository.save(user);
            log.info("Successfully created user: {}", savedUser.getUsername());
            return savedUser;
        } catch (Exception e) {
            log.error("Error creating user: ", e);
            throw new RuntimeException("Failed to create user", e);
        }
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> getUsersByDepartment(String department) {
        return userRepository.findByDepartmentsName(department);
    }    public User updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
          // Try to find by enum value first
        Optional<Roles> roleOpt = Optional.empty();
        try {
            Role roleEnum = Role.valueOf(roleName);
            roleOpt = roleRepository.findByRole(roleEnum);
        } catch (IllegalArgumentException e) {
            // Try to find by string
            roleOpt = roleRepository.findByRole(Role.valueOf(roleName));
        }
        
        Roles role = roleOpt.orElseThrow(() -> new RuntimeException("Role not found"));
        
        user.setRoles(Set.of(role));
        return userRepository.save(user);
    }

    public User toggleUserActivation(Long userId, boolean active) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setActive(active);
        return userRepository.save(user);
    }
}
