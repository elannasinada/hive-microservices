package com.gl.hive.TaskService.repository;

import com.gl.hive.TaskService.model.entity.Task;
import com.gl.hive.shared.lib.model.enums.TaskPriority;
import com.gl.hive.shared.lib.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    Optional<Task> findByAssignedUsers_UserIdAndTaskId(long userId, Long taskId);


    Optional<Task> findByProjectIdAndTaskName(Long projectId, String taskName);


    List<Task> findByProjectId(Long projectId);


    List<Task> findByTaskPriority(TaskPriority taskPriority);


    List<Task> findByTaskStatus(TaskStatus taskStatus);

}