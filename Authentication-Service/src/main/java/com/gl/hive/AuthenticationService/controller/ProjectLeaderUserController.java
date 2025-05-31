package com.gl.hive.AuthenticationService.controller;

import com.gl.hive.AuthenticationService.model.entity.User;
import com.gl.hive.AuthenticationService.repository.UserRepository;
import com.gl.hive.shared.lib.model.enums.Department;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Controller for PROJECT_LEADER specific user operations.
 * Uses a separate path to avoid admin-only restrictions.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/project-leader/users")
@RequiredArgsConstructor
public class ProjectLeaderUserController {

    private final UserRepository userRepository;

    /**
     * Get all users from the current PROJECT_LEADER's department.
     * This endpoint is specifically for PROJECT_LEADERs to access users for task assignment.
     */
    @GetMapping("/my-department")
    @PreAuthorize("hasAnyAuthority('ROLE_PROJECT_LEADER', 'ROLE_ADMIN')")
    public List<User> getUsersFromMyDepartment() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null ? authentication.getName() : null;
        
        if (username == null) {
            log.error("No authenticated user found for /my-department");
            return List.of();
        }

        log.info("PROJECT_LEADER accessing /api/v1/project-leader/users/my-department. User: {}", username);

        try {
            // Get the current user to find their department
            Optional<User> currentUserOpt = userRepository.findByUsername(username);
            if (currentUserOpt.isEmpty()) {
                log.error("Current user '{}' not found in database", username);
                return List.of();
            }

            User currentUser = currentUserOpt.get();
            if (currentUser.getDepartments() == null || currentUser.getDepartments().isEmpty()) {
                log.warn("Current user '{}' has no department assigned", username);
                return List.of();
            }

            // Get the first department (assuming user belongs to one department)
            Department userDepartment = 
                currentUser.getDepartments().iterator().next().getDepartment();
            
            List<User> users = userRepository.findByDepartmentsEnum(userDepartment);
            log.info("Returning {} users from current user's department '{}' for PROJECT_LEADER: {}", 
                    users.size(), userDepartment, users);
            return users;
        } catch (Exception e) {
            log.error("Error fetching users from current user's department for PROJECT_LEADER: {}", e.getMessage());
            return List.of();
        }
    }
}
