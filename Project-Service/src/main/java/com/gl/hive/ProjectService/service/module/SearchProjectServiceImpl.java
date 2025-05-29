package com.gl.hive.ProjectService.service.module;

import com.gl.hive.ProjectService.feign.client.AuthUserFeignClient;
import com.gl.hive.ProjectService.feign.client.CommentFeignClient;
import com.gl.hive.ProjectService.model.dto.ProjectMembersDto;
import com.gl.hive.ProjectService.model.entity.Project;
import com.gl.hive.ProjectService.model.response.SearchResponse;
import com.gl.hive.ProjectService.repository.ProjectRepository;
import com.gl.hive.ProjectService.repository.ProjectMembersRepository;
import com.gl.hive.ProjectService.service.interfaces.SearchProjectService;
import com.gl.hive.ProjectService.util.ProjectUtilsImpl;
import com.gl.hive.shared.lib.exceptions.HiveException;
import com.gl.hive.shared.lib.exceptions.ResourceNotFoundException;
import com.gl.hive.shared.lib.model.dto.CommentDTO;
import com.gl.hive.shared.lib.model.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletRequest;

import java.util.ArrayList;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service implementation for searching projects.
 */
@Slf4j
@Service
@RequiredArgsConstructor // TODO:: pagination
public class SearchProjectServiceImpl implements SearchProjectService {

    private final ProjectRepository projectRepository;
    private final AuthUserFeignClient authUserFeignClient;
    private final CommentFeignClient commentFeignClient;
    private final ProjectUtilsImpl projectUtils;
    private final ProjectMembersRepository projectMembersRepository;
    private final HttpServletRequest httpServletRequest;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<SearchResponse> listAllProjects() {
        String requestHeader = httpServletRequest.getHeader("Authorization");
        UserDTO currentUser = authUserFeignClient.getCurrentUsers_DTO(requestHeader);
        List<String> roles = currentUser.getRoles().stream().map(r -> r.getRole().name()).toList();
        List<Project> projects;
        if (roles.contains("ADMIN")) {
            projects = projectRepository.findAll();
        } else if (roles.contains("PROJECT_LEADER")) {
            projects = projectRepository.findAll().stream()
                    .filter(p -> p.getLeaderId() != null && p.getLeaderId().equals(currentUser.getUserId()))
                    .toList();
        } else if (roles.contains("TEAM_MEMBER")) {
            // Find projects where the user is a member
            List<Long> memberProjectIds = projectMembersRepository.findAll().stream()
                    .filter(pm -> pm.getUserId().equals(currentUser.getUserId()))
                    .map(pm -> pm.getProject().getProjectId())
                    .toList();
            projects = projectRepository.findAll().stream()
                    .filter(p -> memberProjectIds.contains(p.getProjectId()))
                    .toList();
        } else {
            projects = List.of();
        }
        // 2. Get all the comments of each of the projects.
        List<CommentDTO> commentDTOs = getCommentDTOs(projects);
        // 3. Map each project to a SearchResponse object and collect them into a list.
        return projects.stream().map(project -> {
            try {
                UserDTO leaderUserDTO = authUserFeignClient.getUserDTOById(project.getLeaderId());
                return SearchResponse.builder()
                        .projectId(project.getProjectId())
                        .projectName(project.getProjectName())
                        .projectDescription(project.getDescription())
                        .leaderName(leaderUserDTO.getUsername())
                        .members(new ProjectMembersDto(projectUtils.getUserDtoList(project)))
                        .commentDTOs(commentDTOs)
                        .progress(project.getProgress())
                        .build();
            } catch (Exception e) {
                log.error("😖 uh oh... there seems to be an error: {{}} 😖", e.getMessage());
                throw new HiveException(
                        e.getMessage(),
                        BAD_REQUEST,
                        BAD_REQUEST.value()
                );
            }
        }).toList();
    }


    /**
     * {@inheritDoc}
     */
    @Override
    public List<SearchResponse> searchForProject(String projectName) {
        // 1. Search for projects with names containing the given string.
        List<Project> projects = projectRepository.findByProjectNameContaining(projectName);

        // 2. Throw an exception if no project is found.
        if (projects == null || projects.isEmpty())
            throw new ResourceNotFoundException(
                    "😖 huh... it seems the project with name '" + projectName + "' wasn't found in the db 😖",
                    NOT_FOUND,
                    NOT_FOUND.value()
            );

        // 3. Find the comments for each of the projects.
        List<CommentDTO> commentDTOs = getCommentDTOs(projects);

        // 4. Map each project to a SearchResponse object and collect them into a list.
        return projects.stream()
                .map(project -> {
                            String leaderName = authUserFeignClient.getUserDTOById(project.getLeaderId()).getUsername();

                            return SearchResponse.builder()
                                    .projectId(project.getProjectId())
                                    .projectName(project.getProjectName())
                                    .projectDescription(project.getDescription())
                                    .leaderName(leaderName)
                                    .members(new ProjectMembersDto(projectUtils.getUserDtoList(project)))
                                    .commentDTOs(commentDTOs)
                                    .progress(project.getProgress())
                                    .build();
                        }
                ).toList();
    }


    private List<CommentDTO> getCommentDTOs(List<Project> projects) {
        List<CommentDTO> commentDTOs = new ArrayList<>();
        for (Project project : projects)
            commentDTOs = commentFeignClient.getCommentListAsDTOs_ByProjectId(project.getProjectId());
        return commentDTOs;
    }

}
