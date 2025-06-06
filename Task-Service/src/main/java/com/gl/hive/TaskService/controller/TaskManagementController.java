package com.gl.hive.TaskService.controller;

import com.gl.hive.TaskService.model.request.TaskRequest;
import com.gl.hive.TaskService.model.response.TaskResponse;
import com.gl.hive.TaskService.service.interfaces.TaskManagementService;
import com.gl.hive.TaskService.service.module.pdf.PDFEntityService;
import com.gl.hive.shared.lib.exceptions.NotLeaderOfProjectException;
import com.gl.hive.shared.lib.exceptions.NotMemberOfProjectException;
import com.gl.hive.shared.lib.exceptions.ResourceAlreadyExistsException;
import com.gl.hive.shared.lib.exceptions.ResourceNotFoundException;
import com.gl.hive.shared.lib.model.enums.Role;
import com.gl.hive.shared.lib.model.enums.TaskPriority;
import com.gl.hive.shared.lib.model.enums.TaskStatus;
import com.gl.hive.shared.lib.model.response.MapResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

/**
 * REST controller for task management such as; new task, delete task, update task, search task, get details of task, export tasks.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/task/management")
public class TaskManagementController {

    private final TaskManagementService taskService;
    private final PDFEntityService pdfEntityService;

    /**
     * Creates a new task for the specified project.
     *
     * @param projectId   the ID of the project that the task is being created for
     * @param taskRequest the request object containing the details of the task to create
     * @return a ResponseEntity containing a TaskResponse object and an HTTP status code
     */
    @PostMapping("/new-task/{projectId}")
    public ResponseEntity<TaskResponse> newTask(
            @Valid @PathVariable Long projectId,
            @RequestBody TaskRequest taskRequest
    ) throws ResourceNotFoundException, ResourceAlreadyExistsException {
        return new ResponseEntity<>(taskService.createNewTask(projectId, taskRequest), HttpStatus.CREATED);
    }


    /**
     * Updates the details of an existing task.
     *
     * @param taskId      the ID of the task to update
     * @param taskRequest the request object containing the updated details of the task
     * @return a ResponseEntity containing a TaskResponse object and an HTTP status code
     * @throws ResourceNotFoundException   if the task is not found
     * @throws NotMemberOfProjectException if the requesting user is not a member of the project that the task is in
     * @throws NotLeaderOfProjectException if the requesting user is not leader or admin of the project that the task is in
     */
    @PutMapping("/update-task/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @Valid @PathVariable Long taskId,
            @RequestBody TaskRequest taskRequest
    ) throws ResourceNotFoundException, NotMemberOfProjectException, NotLeaderOfProjectException {
        return ResponseEntity.ok(taskService.updateTask(taskId, taskRequest));
    }


    /**
     * Retrieves the details of a specific task by its ID.
     *
     * @param taskId the ID of the task to retrieve
     * @return a ResponseEntity containing a TaskResponse object and an HTTP status code
     * @throws ResourceNotFoundException if the task is not found
     */
    @GetMapping("/task/{taskId}")
    public ResponseEntity<TaskResponse> getTaskDetails(
            @PathVariable Long taskId
    ) throws ResourceNotFoundException {
        return ResponseEntity.ok(taskService.getTaskDetails(taskId));
    }


    /**
     * Deletes a task by its ID.
     *
     * @param taskId the ID of the task to delete
     * @return a ResponseEntity with an OK HTTP status code
     * @throws ResourceNotFoundException   if the task is not found
     * @throws NotLeaderOfProjectException if the requesting user is not {@link Role#PROJECT_LEADER leader}/{@link Role#ADMIN admin} of the project
     */
    @DeleteMapping("/deleteTask/projectId/{projectId}/taskId/{taskId}")
    public ResponseEntity<MapResponse> deleteTask(
            @PathVariable long projectId,
            @PathVariable long taskId
    ) throws ResourceNotFoundException, NotLeaderOfProjectException {

        taskService.deleteTask(projectId, taskId);
        HashMap<Object, Object> mapResponse = new HashMap<>();
        mapResponse.put("ProjectID: " + projectId, "Task with taskID: '" + taskId + "' deleted successfully ✅");

        return ResponseEntity.ok(new MapResponse(mapResponse));
    }


    /**
     * Searches for tasks based on different criteria.
     *
     * @param status            the status of the tasks to search for
     * @param priority          the priority of the tasks to search for
     * @param projectId         the ID of the project to search for tasks in
     * @param assignedTo_UserId the ID of the user the tasks are assigned to
     * @return a ResponseEntity containing a list of TaskResponse objects and an HTTP status code
     */
    @GetMapping("/searchTasks")
    public ResponseEntity<List<TaskResponse>> searchTasks(
            @RequestParam(value = "status", required = false) TaskStatus status,
            @RequestParam(value = "priority", required = false) TaskPriority priority,
            @RequestParam(value = "projectId", required = false) Long projectId,
            @RequestParam(value = "assignedTo_UserId", required = false) Long assignedTo_UserId
    ) {
        return ResponseEntity.ok(taskService.searchTaskBasedOnDifferentCriteria(status, priority, projectId, assignedTo_UserId));
    }


    /**
     * Exports tasks to a specified format.
     *
     * @param format     the format to export the tasks to (CSV, Excel, PDF, etc.)
     * @param status     the status of the tasks to export
     * @param priority   the priority of the tasks to export
     * @param projectId  the ID of the project to export tasks for
     * @param assignedTo the ID of the user the tasks are assigned to
     * @return a ResponseEntity containing the exported file and an HTTP status code
     */
    @GetMapping("/exportTasks") //TODO
    public ResponseEntity<InputStreamResource> exportTasks(
//            @RequestParam(value = "format") String format,
//            @RequestParam(value = "status", required = false) TaskStatus status,
//            @RequestParam(value = "priority", required = false) TaskPriority priority,
//            @RequestParam(value = "projectId", required = false) Long projectId,
//            @RequestParam(value = "assignedTo", required = false) Long assignedTo
    ) {

        DateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd HH-mm-ss");
        String currentDate = dateFormatter.format(new Date());
        String filename = "TaskList(" + currentDate + ").pdf";

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add("Content-Disposition", "attachment; filename=" + filename);

        return ResponseEntity
                .ok()
                .headers(httpHeaders)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(pdfEntityService.createTaskPDF()));
    }

}