package com.gl.hive.TaskService.controller;

import com.gl.hive.TaskService.service.interfaces.TaskProgressService;
import com.gl.hive.shared.lib.exceptions.HiveException;
import com.gl.hive.shared.lib.exceptions.NotLeaderOfProjectException;
import com.gl.hive.shared.lib.exceptions.NotMemberOfProjectException;
import com.gl.hive.shared.lib.exceptions.ResourceNotFoundException;
import com.gl.hive.shared.lib.model.enums.TaskStatus;
import com.gl.hive.shared.lib.model.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * REST controller for marking tasks as completed.
 * Requires the `PROJECT_LEADER` or `ADMIN` role to access.
 */
@RestController
@RequestMapping("/api/v1/task/progress")
@RequiredArgsConstructor
public class TaskProgressController {

    private final TaskProgressService taskService;

    /**
     * Marks a task as completed.
     *
     * @param taskId     the ID of the task to mark as completed (passed as a request parameter).
     * @param projectId  the ID of the project that the task belongs to (passed as a request parameter).
     * @param taskStatus the new status of the task (passed as a request parameter).
     * @return a ResponseEntity with a status of 200 OK if the task was successfully marked as completed.
     * @throws HiveException           if the task has already been completed, or if the task status is not {@link TaskStatus#COMPLETED}.
     * @throws ResourceNotFoundException   if the task or project with the given IDs cannot be found in the database.
     * @throws NotMemberOfProjectException if the current user is not a member of the project with the given ID.
     * @throws NotLeaderOfProjectException if the current user is not a leader or admin of the project with the given ID.
     */
    @PostMapping("/{taskId}/{projectId}")
    public ResponseEntity<ApiResponse> markTaskAsCompleted(
            @PathVariable("taskId") Long taskId,
            @PathVariable("projectId") Long projectId,
            @RequestParam TaskStatus taskStatus
    ) throws HiveException, ResourceNotFoundException, NotMemberOfProjectException, NotLeaderOfProjectException {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd-HH:mm:ss");
        String formattedDate = dateFormat.format(new Date());

        taskService.markTaskAsCompleted(taskId, projectId, taskStatus);

        return ResponseEntity.ok(new ApiResponse(
                        "Congratulations on completing the Task. Task Completed at: " + formattedDate + "!",
                        true
                )
        );
    }

}
