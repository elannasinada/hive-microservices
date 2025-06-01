package com.gl.hive.ProjectService.service.module;

import com.gl.hive.ProjectService.feign.client.AuthUserFeignClient;
import com.gl.hive.ProjectService.model.dto.ProjectMembersDto;
import com.gl.hive.ProjectService.model.entity.Project;
import com.gl.hive.ProjectService.model.entity.ProjectMembers;
import com.gl.hive.ProjectService.model.entity.UserProjectRole;
import com.gl.hive.ProjectService.model.request.ProjectRequest;
import com.gl.hive.ProjectService.repository.ProjectMembersRepository;
import com.gl.hive.ProjectService.repository.ProjectRepository;
import com.gl.hive.ProjectService.repository.UserProjectRoleRepository;
import com.gl.hive.ProjectService.service.interfaces.ProjectManagementService;
import com.gl.hive.ProjectService.util.ProjectUtilsImpl;
import com.gl.hive.ProjectService.util.RepositoryUtils;
import com.gl.hive.shared.lib.exceptions.ResourceAlreadyExistsException;
import com.gl.hive.shared.lib.model.dto.UserDTO;
import com.gl.hive.shared.lib.model.enums.Role;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.HttpStatus.NOT_ACCEPTABLE;

/**
 * Service Implementation of Project Creation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public
class ProjectManagementServiceImpl implements ProjectManagementService {

    private final UserProjectRoleRepository userProjectRoleRepository;
    private final ProjectMembersRepository projectMembersRepository;
    private final ProjectRepository projectRepository;
    private final ModelMapper modelMapper;
    private final AuthUserFeignClient authUserFeignClient;
    private final HttpServletRequest httpServletRequest;
    private final ProjectUtilsImpl projectUtils;
    private final RepositoryUtils repositoryUtils;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public ProjectRequest createProject(ProjectRequest projectRequest) {
        // Check if a project with the same name already exists
        validateProjectNameUnique(projectRequest.getProjectName());

        // Get the current user and Add the `PROJECT_LEADER` role to the current user and save to db
        String requestHeader = httpServletRequest.getHeader(AUTHORIZATION);
        Long currentUserId = authUserFeignClient.getCurrentUsers_Id(requestHeader);

        // Make API call to `AUTHENTICATION-SERVICE` to add `PROJECT_LEADER` role to the `current user`
        authUserFeignClient.addProjectLeaderRoleToUser(currentUserId);

        // Map the projectRequest to a Project object and set the leader to the current user
        Project project = createProjectFromRequest(projectRequest, currentUserId);

        // Save the project to the database
        // Create a new `ProjectMembers` object for mapping a member for the current user
        // Create a new `UserProjectRole` object for mapping `PROJECT_LEADER` role for the user and project
        Long projectLeaderRoleId = authUserFeignClient.getProjectLeaderRoleId();
        saveProjectAndRelatedInfo(project, currentUserId, projectLeaderRoleId);

        // Return a `ProjectRequest` object with the project information as response
        return createProjectRequestFromProject(project);
    }


    /**
     * {@inheritDoc}
     */
    @Override
    public ProjectMembersDto listMembersOfProject(Long projectId) {
        Project project = repositoryUtils.findProjectById_OrElseThrow_ResourceNotFoundException(projectId);
        return new ProjectMembersDto(projectUtils.getUserDtoList(project));
    }

    @Override
    public void addMemberToProject(Long projectId, Long userId) {
        String requestHeader = httpServletRequest.getHeader("Authorization");
        UserDTO currentUser = authUserFeignClient.getCurrentUsers_DTO(requestHeader);
        List<String> roles = currentUser.getRoles().stream().map(r -> r.getRole().name()).toList();
        Project project = repositoryUtils.findProjectById_OrElseThrow_ResourceNotFoundException(projectId);
        // Only ADMIN or project leader can add
        if (!(roles.contains("ADMIN") || (roles.contains("PROJECT_LEADER") && project.getLeaderId().equals(currentUser.getUserId())))) {
            throw new com.gl.hive.shared.lib.exceptions.HiveException("Not authorized to add members to this project", org.springframework.http.HttpStatus.FORBIDDEN, 403);
        }
        // Only TEAM_MEMBERs can be added
        UserDTO userToAdd = authUserFeignClient.getUserDTOById(userId);
        boolean isTeamMember = userToAdd.getRoles().stream().anyMatch(r -> r.getRole().name().equals("TEAM_MEMBER"));
        if (!isTeamMember) {
            throw new com.gl.hive.shared.lib.exceptions.HiveException("Only TEAM_MEMBERs can be added to a project", org.springframework.http.HttpStatus.BAD_REQUEST, 400);
        }
        // Enforce single active project rule
        List<ProjectMembers> activeAssignments = projectMembersRepository.findByUserIdAndActiveTrue(userId);
        if (!activeAssignments.isEmpty()) {
            ProjectMembers currentAssignment = activeAssignments.get(0);
            Project currentProject = currentAssignment.getProject();
            if (currentProject.getEndDate() != null && currentProject.getEndDate().isBefore(java.time.LocalDate.now())) {
                // Mark previous as inactive
                currentAssignment.setActive(false);
                currentAssignment.setCompletedAt(java.time.LocalDateTime.now());
                projectMembersRepository.save(currentAssignment);
            } else {
                throw new com.gl.hive.shared.lib.exceptions.HiveException("User already has an active project assignment.", org.springframework.http.HttpStatus.BAD_REQUEST, 400);
            }
        }
        // Prevent duplicate assignment
        boolean alreadyMember = projectMembersRepository.findByProject_ProjectId(projectId).stream().anyMatch(pm -> pm.getUserId().equals(userId));
        if (alreadyMember) {
            throw new com.gl.hive.shared.lib.exceptions.HiveException("User is already a member of this project", org.springframework.http.HttpStatus.BAD_REQUEST, 400);
        }
        ProjectMembers newMember = new ProjectMembers(userId, project);
        newMember.setAssignedAt(java.time.LocalDateTime.now());
        newMember.setActive(true);
        projectMembersRepository.save(newMember);
        project.incrementMemberCount();
        projectRepository.save(project);
    }

    @Override
    public void removeMemberFromProject(Long projectId, Long userId) {
        String requestHeader = httpServletRequest.getHeader("Authorization");
        UserDTO currentUser = authUserFeignClient.getCurrentUsers_DTO(requestHeader);
        List<String> roles = currentUser.getRoles().stream().map(r -> r.getRole().name()).toList();
        Project project = repositoryUtils.findProjectById_OrElseThrow_ResourceNotFoundException(projectId);
        // Only ADMIN or project leader can remove
        if (!(roles.contains("ADMIN") || (roles.contains("PROJECT_LEADER") && project.getLeaderId().equals(currentUser.getUserId())))) {
            throw new com.gl.hive.shared.lib.exceptions.HiveException("Not authorized to remove members from this project", org.springframework.http.HttpStatus.FORBIDDEN, 403);
        }
        // Only TEAM_MEMBERs can be removed
        UserDTO userToRemove = authUserFeignClient.getUserDTOById(userId);
        boolean isTeamMember = userToRemove.getRoles().stream().anyMatch(r -> r.getRole().name().equals("TEAM_MEMBER"));
        if (!isTeamMember) {
            throw new com.gl.hive.shared.lib.exceptions.HiveException("Only TEAM_MEMBERs can be removed from a project", org.springframework.http.HttpStatus.BAD_REQUEST, 400);
        }
        // Remove member if exists
        List<ProjectMembers> members = projectMembersRepository.findByProject_ProjectId(projectId);
        for (ProjectMembers pm : members) {
            if (pm.getUserId().equals(userId)) {
                projectMembersRepository.delete(pm);
                project.setMemberCount(Math.max(0, project.getMemberCount() - 1));
                projectRepository.save(project);
                return;
            }
        }
        throw new com.gl.hive.shared.lib.exceptions.HiveException("User is not a member of this project", org.springframework.http.HttpStatus.BAD_REQUEST, 400);
    }

    @Override
    public void updateProject(Long projectId, ProjectRequest projectRequest) {
        String requestHeader = httpServletRequest.getHeader("Authorization");
        UserDTO currentUser = authUserFeignClient.getCurrentUsers_DTO(requestHeader);
        List<String> roles = currentUser.getRoles().stream().map(r -> r.getRole().name()).toList();
        Project project = repositoryUtils.findProjectById_OrElseThrow_ResourceNotFoundException(projectId);
        if (!(roles.contains("ADMIN") || (roles.contains("PROJECT_LEADER") && project.getLeaderId().equals(currentUser.getUserId())))) {
            throw new com.gl.hive.shared.lib.exceptions.HiveException("Not authorized to update this project", org.springframework.http.HttpStatus.FORBIDDEN, 403);
        }
        // Update fields
        if (projectRequest.getProjectName() != null) project.setProjectName(projectRequest.getProjectName());
        if (projectRequest.getProjectDescription() != null) project.setDescription(projectRequest.getProjectDescription());
        if (projectRequest.getStartDate() != null) project.setStartDate(projectRequest.getStartDate());
        if (projectRequest.getEndDate() != null) project.setEndDate(projectRequest.getEndDate());
        projectRepository.save(project);
    }

    @Override
    public void deleteProject(Long projectId) {
        String requestHeader = httpServletRequest.getHeader("Authorization");
        UserDTO currentUser = authUserFeignClient.getCurrentUsers_DTO(requestHeader);
        List<String> roles = currentUser.getRoles().stream().map(r -> r.getRole().name()).toList();
        Project project = repositoryUtils.findProjectById_OrElseThrow_ResourceNotFoundException(projectId);
        if (!(roles.contains("ADMIN") || (roles.contains("PROJECT_LEADER") && project.getLeaderId().equals(currentUser.getUserId())))) {
            throw new com.gl.hive.shared.lib.exceptions.HiveException("Not authorized to delete this project", org.springframework.http.HttpStatus.FORBIDDEN, 403);
        }
        throw new com.gl.hive.shared.lib.exceptions.HiveException("Not implemented", org.springframework.http.HttpStatus.NOT_IMPLEMENTED, 501);
    }

    private void validateProjectNameUnique(String projectName) {
        Optional<Project> foundProject = projectRepository.findByProjectNameAllIgnoreCase(projectName);
        if (foundProject.isPresent()) {
            log.error("⚠️this project already exists! provide a unique name");
            throw new ResourceAlreadyExistsException(
                    String.format("Project with provided name: {%s} already exists", projectName),
                    NOT_ACCEPTABLE,
                    NOT_ACCEPTABLE.value()
            );
        }
    }


    private Project createProjectFromRequest(ProjectRequest projectRequest, Long leaderId) {
        Project project = modelMapper.map(projectRequest, Project.class);

        project.setLeaderId(leaderId);
        project.incrementMemberCount();
        project.setStartDate(projectRequest.getStartDate());
        project.setEndDate(projectRequest.getEndDate());
        project.setProgress(0);

        return project;
    }


    private void saveProjectAndRelatedInfo(Project project, Long currentUserId, Long projectLeaderRole) {
        projectRepository.save(project);

        ProjectMembers projectMembers = new ProjectMembers(currentUserId, project);
        projectMembersRepository.save(projectMembers);

        UserProjectRole userProjectRole = new UserProjectRole(currentUserId, projectLeaderRole, project);
        userProjectRoleRepository.save(userProjectRole);
    }


    private ProjectRequest createProjectRequestFromProject(Project project) {
        return ProjectRequest.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .projectDescription(project.getDescription())
                .createdAt(project.getCreatedAt())
                .creationTime(project.getCreationTime())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .progress(project.getProgress())
                .build();
    }

}
