package com.gl.hive.ProjectService.controller;

import com.gl.hive.ProjectService.model.dto.ProjectMembersDto;
import com.gl.hive.ProjectService.model.request.ProjectRequest;
import com.gl.hive.ProjectService.service.interfaces.ProjectManagementService;
import com.gl.hive.ProjectService.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.springframework.http.HttpStatus.CREATED;

/**
 * REST controller for managing projects.
 */
@RestController
@RequestMapping("/api/v1/project")
@RequiredArgsConstructor
public class ProjectManagementController {

    private final ProjectManagementService projectManagementService;

    /**
     * Endpoint for creating a new project.
     *
     * @param projectRequest the project details to create
     * @return a ResponseEntity containing the created project and an HTTP status code of 201 (CREATED)
     */
    @PostMapping("/create-project")
    @PreAuthorize("hasAnyRole('PROJECT_LEADER', 'ADMIN')")
    public ResponseEntity<ProjectRequest> createProject(@RequestBody ProjectRequest projectRequest) {
        return new ResponseEntity<>(projectManagementService.createProject(projectRequest), CREATED);
    }


    /**
     * Lists all the members of the specified project.
     *
     * @param projectId the members of the project that we want to see
     * @return list of project members as {@link ProjectMembersDto}
     * @throws ResourceNotFoundException if the project was not found
     */
    @GetMapping("/list-members/{projectId}")
    @PreAuthorize("hasAnyRole('PROJECT_LEADER', 'ADMIN')")
    public ResponseEntity<ProjectMembersDto> listProjectMembers(
            @PathVariable Long projectId
    ) throws ResourceNotFoundException {
        return ResponseEntity.ok(projectManagementService.listMembersOfProject(projectId));
    }

    @PostMapping("/{projectId}/add-member/{userId}")
    @PreAuthorize("hasAnyRole('PROJECT_LEADER', 'ADMIN')")
    public ResponseEntity<String> addMemberToProject(@PathVariable Long projectId, @PathVariable Long userId) {
        projectManagementService.addMemberToProject(projectId, userId);
        return ResponseEntity.ok("User added to project");
    }

    @DeleteMapping("/{projectId}/remove-member/{userId}")
    @PreAuthorize("hasAnyRole('PROJECT_LEADER', 'ADMIN')")
    public ResponseEntity<String> removeMemberFromProject(@PathVariable Long projectId, @PathVariable Long userId) {
        projectManagementService.removeMemberFromProject(projectId, userId);
        return ResponseEntity.ok("User removed from project");
    }

    @PutMapping("/update/{projectId}")
    @PreAuthorize("hasAnyRole('PROJECT_LEADER', 'ADMIN')")
    public ResponseEntity<String> updateProject(@PathVariable Long projectId, @RequestBody ProjectRequest projectRequest) {
        projectManagementService.updateProject(projectId, projectRequest);
        return ResponseEntity.ok("Project update endpoint called");
    }

    @DeleteMapping("/delete/{projectId}")
    @PreAuthorize("hasAnyRole('PROJECT_LEADER', 'ADMIN')")
    public ResponseEntity<String> deleteProject(@PathVariable Long projectId) {
        projectManagementService.deleteProject(projectId);
        return ResponseEntity.ok("Project delete endpoint called");
    }

}
