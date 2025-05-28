package com.gl.hive.ProjectService.service.interfaces;

import com.gl.hive.ProjectService.model.dto.ProjectMembersDto;
import com.gl.hive.ProjectService.model.request.ProjectRequest;
import com.gl.hive.shared.lib.exceptions.ResourceAlreadyExistsException;
import com.gl.hive.shared.lib.exceptions.ResourceNotFoundException;

public interface ProjectManagementService {

    /**
     * Creates a new project with the provided {@link ProjectRequest} class.
     *
     * @param projectRequest the projectRequest containing the project information like name and description
     * @return the same {@link ProjectRequest} class with the newly created project's information
     * @throws ResourceAlreadyExistsException if a project with the same name already exists
     * @throws ResourceNotFoundException      if the PROJECT_LEADER role is not found
     */
    ProjectRequest createProject(ProjectRequest projectRequest)
            throws ResourceNotFoundException, ResourceAlreadyExistsException;


    /**
     * Lists all the members of the specified project.
     *
     * @param projectId the members of the project that we want to see
     * @return list of project members as {@link ProjectMembersDto}
     * @throws ResourceNotFoundException if the project was not found
     */
    ProjectMembersDto listMembersOfProject(Long projectId)
            throws ResourceNotFoundException;

    void addMemberToProject(Long projectId, Long userId);
    void removeMemberFromProject(Long projectId, Long userId);

    void updateProject(Long projectId, ProjectRequest projectRequest);
    void deleteProject(Long projectId);
}
