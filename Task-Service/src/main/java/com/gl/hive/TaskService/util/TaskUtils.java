package com.gl.hive.TaskService.util;

import com.gl.hive.TaskService.fegin.client.AuthUserFeignClient;
import com.gl.hive.TaskService.fegin.client.ProjectUtilFeignClient;
import com.gl.hive.TaskService.model.entity.Task;
import com.gl.hive.TaskService.model.request.TaskRequest;
import com.gl.hive.TaskService.model.response.TaskResponse;
import com.gl.hive.TaskService.repository.TaskRepository;
import com.gl.hive.shared.lib.exceptions.HiveException;
import com.gl.hive.shared.lib.exceptions.NotLeaderOfProjectException;
import com.gl.hive.shared.lib.exceptions.NotMemberOfProjectException;
import com.gl.hive.shared.lib.exceptions.ResourceNotFoundException;
import com.gl.hive.shared.lib.model.dto.ProjectDTO;
import com.gl.hive.shared.lib.model.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.springframework.http.HttpStatus.EXPECTATION_FAILED;
import static org.springframework.http.HttpStatus.FORBIDDEN;

/**
 * A utility class that provides helper methods for working with tasks.
 */
@Service
@RequiredArgsConstructor
public class TaskUtils {

    private final TaskRepository taskRepository;
    private final AuthUserFeignClient authFeignClient;
    private final ProjectUtilFeignClient projectFeignClient;
    private static final Logger log = LoggerFactory.getLogger(TaskUtils.class);

    /**
     * Checks if a task with the same name already exists in the project
     *
     * @param taskRequest the request object containing the details of the task to create
     * @param projectId   the project to check for existing tasks
     * @return true if a task with the same name already exists in the project, false otherwise
     */
    public boolean doesTaskAlreadyExists(TaskRequest taskRequest, Long projectId) {
        Optional<Task> foundTask = taskRepository.findByProjectIdAndTaskName(projectId, taskRequest.getTaskName());
        return foundTask.isPresent();
    }


    /**
     * Validates whether the task belongs to the project and whether the user is a member and leader/admin of the project.
     *
     * @param task      the task to validate
     * @param projectId the project to validate against
     * @param userId    the user to validate
     * @throws HiveException           if the task does not belong to the project
     * @throws NotMemberOfProjectException if the user is not a member of the project
     * @throws NotLeaderOfProjectException if the user is not the leader or admin of the project
     */
    public void validateTaskAndProject(Task task, long projectId, long userId) {
        // 1. Check if the task belongs to the project or throw a HiveException
        if (!task.getProjectId().equals(projectId))
            throw new HiveException(
                    "😖 Task {" + task.getTaskName() + "} does not belong to project {" + projectId + "} 😖",
                    EXPECTATION_FAILED,
                    EXPECTATION_FAILED.value()
            );

        // 2. Check if the user is a member of the project or else throw a NotMemberOfProjectException
        long userDTO_Id = authFeignClient.getUserDTOById(userId).getUserId();
        if (!projectFeignClient.isMemberOfProject(projectId, userDTO_Id))
            throw new NotMemberOfProjectException(
                    "Ⓜ️👥 You are not a member of THIS project 👥Ⓜ️",
                    FORBIDDEN,
                    FORBIDDEN.value()
            );

        // 3. Check if the user is the leader or admin of the project or else throw a NotLeaderOfProjectException
        if (!projectFeignClient.isLeaderOrAdminOfProject(projectId, userId))
            throw new NotLeaderOfProjectException(
                    "👮🏻You are not the leader or admin of THIS project👮🏻",
                    FORBIDDEN,
                    FORBIDDEN.value()
            );
    }


    /**
     * Builds a TaskResponse object.
     *
     * @param task the assigned task
     * @return a TaskResponse object with information about the newly created task and updated task.
     */
    public TaskResponse buildTaskResponse(Task task) {
        ProjectDTO project = null;
        try {
            project = projectFeignClient.getProjectAsDTO(task.getProjectId());
        } catch (Exception e) {
            log.error("Error fetching project details for task " + task.getTaskId(), e);
            // Project details will be null
        }

        Map<String, String> assignededUsersMap = new HashMap<>();
        if (task.getAssignedUsers() != null) {
            task.getAssignedUsers().forEach(taskUser -> {
                try {
                    UserDTO assignedUser = authFeignClient.getUserDTOById(taskUser.getUserId());
                    if (assignedUser != null) {
                        assignededUsersMap.put(assignedUser.getUserId().toString(), assignedUser.getUsername());
                    } else {
                         log.warn("User with ID " + taskUser.getUserId() + " not found for task " + task.getTaskId());
                    }
                } catch (ResourceNotFoundException e) {
                     log.warn("User with ID " + taskUser.getUserId() + " not found (ResourceNotFoundException) for task " + task.getTaskId());
                     // User details for this specific user will be missing in the map
                } catch (Exception e) {
                    log.error("Error fetching user details for task " + task.getTaskId() + " and user " + taskUser.getUserId(), e);
                    // User details for this specific user will be missing in the map
                }
            });
        }

        return TaskResponse.builder()
                .taskId(task.getTaskId())
                .taskName(task.getTaskName())
                .projectName(project != null ? project.getProjectName() : "N/A") // Use "N/A" if project is null
                .taskStatus(task.getTaskStatus())
                .dueDate(task.getDueDate())
                .assignedUsers(assignededUsersMap)
                .build();
    }

}
