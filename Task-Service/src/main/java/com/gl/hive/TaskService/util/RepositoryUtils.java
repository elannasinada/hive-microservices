package com.gl.hive.TaskService.util;

import com.gl.hive.TaskService.fegin.client.ProjectUtilFeignClient;
import com.gl.hive.TaskService.model.entity.Task;
import com.gl.hive.TaskService.repository.TaskRepository;
import com.gl.hive.shared.lib.exceptions.ResourceNotFoundException;
import com.gl.hive.shared.lib.model.dto.ProjectDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Slf4j
@Component
@RequiredArgsConstructor
public class RepositoryUtils {

    private final TaskRepository taskRepository;
    private final ProjectUtilFeignClient projectUtilFeignClient;

    public Task find_TaskById_OrElseThrow_ResourceNotFoundException(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> {
                    log.error("😖 huh... it seems the task with ID {{}} wasn't found in the db 😖", taskId);
                    return new ResourceNotFoundException(
                            "😖 huh... it seems the project with  ID {" + taskId + "} wasn't found in the db 😖",
                            NOT_FOUND,
                            NOT_FOUND.value()
                    );
                });
    }


    public ProjectDTO find_ProjectDTOById_OrElseThrow_ResourceNotFoundException(Long projectId) {
        return projectUtilFeignClient.getProjectAsDTO(projectId);
    }

}
