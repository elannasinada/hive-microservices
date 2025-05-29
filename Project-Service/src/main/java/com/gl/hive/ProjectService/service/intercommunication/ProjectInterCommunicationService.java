package com.gl.hive.ProjectService.service.intercommunication;

import com.gl.hive.ProjectService.feign.client.AuthUserFeignClient;
import com.gl.hive.ProjectService.model.entity.Project;
import com.gl.hive.ProjectService.model.entity.ProjectMembers;
import com.gl.hive.ProjectService.repository.ProjectMembersRepository;
import com.gl.hive.ProjectService.repository.ProjectRepository;
import com.gl.hive.ProjectService.util.ProjectUtilsImpl;
import com.gl.hive.ProjectService.util.RepositoryUtils;
import com.gl.hive.shared.lib.model.dto.ProjectDTO;
import com.gl.hive.shared.lib.model.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectInterCommunicationService {

    private final ProjectRepository projectRepository;
    private final AuthUserFeignClient authUserFeignClient;
    private final ProjectUtilsImpl projectUtils;
    private final RepositoryUtils repositoryUtils;
    private final ProjectMembersRepository projectMembersRepository;

    public boolean isMemberOfProject(Long projectId, long userId) {
        Project project = repositoryUtils.findProjectById_OrElseThrow_ResourceNotFoundException(projectId);
        UserDTO userDTO = authUserFeignClient.getUserDTOById(userId);

        return projectUtils.isMemberOfProject(project, userDTO);
    }


    public boolean isLeaderOrAdminOfProject(long projectId, long userId) {
        Project project = repositoryUtils.findProjectById_OrElseThrow_ResourceNotFoundException(projectId);
        UserDTO userDTO = authUserFeignClient.getUserDTOById(userId);

        return projectUtils.isLeaderOrAdminOfProject(project, userDTO);
    }


    public ProjectDTO getProjectDTO(long projectId) {
        Project project = repositoryUtils.findProjectById_OrElseThrow_ResourceNotFoundException(projectId);
        return ProjectDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .description(project.getDescription())
                .createdAt(project.getCreatedAt())
                .creationTime(project.getCreationTime())
                .leaderId(project.getLeaderId())
                .memberCount(project.getMemberCount())
                .build();
    }


    public List<UserDTO> getUsersAssociatedWithTaskAndProject(long projectId) {
        return repositoryUtils.find_ProjectMembersByProjectId(projectId)
                .stream()
                .map(projectMembers -> authUserFeignClient.getUserDTOById(projectMembers.getUserId()))
                .toList();
    }


    public boolean validateProjectExists(long projectId) {
        return projectRepository.findById(projectId)
                .isPresent();
    }

    public ProjectDTO getActiveProjectForUser(Long userId) {
        ProjectMembers activeAssignment = projectMembersRepository.findByUserIdAndActiveTrue(userId).stream().findFirst().orElse(null);
        if (activeAssignment == null) return null;
        Project project = activeAssignment.getProject();
        // Fetch tasks and team members as needed
        // ...
        return ProjectDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .description(project.getDescription())
                .createdAt(project.getCreatedAt())
                .creationTime(project.getCreationTime())
                .leaderId(project.getLeaderId())
                .memberCount(project.getMemberCount())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                // Add tasks, team, progress, etc.
                .build();
    }

    public List<ProjectDTO> getCompletedProjectsForUser(Long userId) {
        List<ProjectMembers> completedAssignments = projectMembersRepository.findByUserIdAndActiveFalse(userId);
        List<ProjectDTO> completedProjects = new java.util.ArrayList<>();
        for (ProjectMembers pm : completedAssignments) {
            Project project = pm.getProject();
            // Fetch tasks, team, metrics as needed
            // ...
            completedProjects.add(ProjectDTO.builder()
                    .projectId(project.getProjectId())
                    .projectName(project.getProjectName())
                    .description(project.getDescription())
                    .createdAt(project.getCreatedAt())
                    .creationTime(project.getCreationTime())
                    .leaderId(project.getLeaderId())
                    .memberCount(project.getMemberCount())
                    .startDate(project.getStartDate())
                    .endDate(project.getEndDate())
                    // Add tasks, team, metrics, etc.
                    .build());
        }
        return completedProjects;
    }

}
