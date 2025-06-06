package com.gl.hive.TaskService.service.interfaces;

import com.gl.hive.TaskService.model.request.TaskRequest;
import com.gl.hive.TaskService.model.response.TaskResponse;
import com.gl.hive.shared.lib.exceptions.NotLeaderOfProjectException;
import com.gl.hive.shared.lib.exceptions.NotMemberOfProjectException;
import com.gl.hive.shared.lib.exceptions.ResourceAlreadyExistsException;
import com.gl.hive.shared.lib.exceptions.ResourceNotFoundException;
import com.gl.hive.shared.lib.model.enums.Role;
import com.gl.hive.shared.lib.model.enums.TaskPriority;
import com.gl.hive.shared.lib.model.enums.TaskStatus;

import java.util.List;

public interface TaskManagementService {

    /**
     * Creates a new task for a given project.
     *
     * @param projectId   the ID of the project to create the task for
     * @param taskRequest the request object containing the details of the task to create
     * @return a TaskResponse object containing the details of the created task
     * @throws ResourceNotFoundException      if the project with the given ID is not found
     * @throws ResourceAlreadyExistsException if a task with the same name already exists in the project
     */
    TaskResponse createNewTask(Long projectId, TaskRequest taskRequest)
            throws ResourceNotFoundException, ResourceAlreadyExistsException;


    /**
     * Updates the details of an existing task.
     *
     * @param taskId      the ID of the task to update
     * @param taskRequest the request object containing the updated details of the task
     * @return {@link TaskResponse} object with updated task information
     * @throws ResourceNotFoundException   if the task is not found
     * @throws NotMemberOfProjectException if the requesting user is not a member of the project that the task is in
     * @throws NotLeaderOfProjectException if the requesting user is not leader or admin of the project that the task is in
     */
    TaskResponse updateTask(Long taskId, TaskRequest taskRequest)
            throws ResourceNotFoundException, NotMemberOfProjectException, NotLeaderOfProjectException;


    /**
     * Retrieves the details of a specific task by its ID.
     *
     * @param taskId the ID of the task to retrieve
     * @return the found task as {@link TaskResponse} object
     * @throws ResourceNotFoundException if the task is not found
     */
    TaskResponse getTaskDetails(Long taskId)
            throws ResourceNotFoundException;


    /**
     * Delete a Task by its ID.
     *
     * @param projectId
     * @param taskId    the ID of the task to delete
     * @throws ResourceNotFoundException   if the task is not found
     * @throws NotLeaderOfProjectException if the requesting user is not {@link Role#PROJECT_LEADER leader}/{@link Role#ADMIN admin} of the project
     */
    void deleteTask(long projectId, long taskId)
            throws ResourceNotFoundException, NotLeaderOfProjectException;


    /**
     * Searches for tasks based on the given criteria.
     *
     * @param status            the status of the tasks to search for (optional)
     * @param priority          the priority of the tasks to search for (optional)
     * @param projectId         the ID of the project that the tasks belong to (optional)
     * @param assignedTo_UserId the ID of the user that the tasks are assigned to (optional)
     * @return a list of {@link TaskResponse TaskResponses} that match the search criteria
     */
    List<TaskResponse> searchTaskBasedOnDifferentCriteria(TaskStatus status, TaskPriority priority, Long projectId, Long assignedTo_UserId);

}
