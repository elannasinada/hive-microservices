package com.gl.hive.TaskService.repository;

import com.gl.hive.TaskService.model.entity.Task;
import com.gl.hive.TaskService.model.entity.TaskUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TaskUserRepository extends JpaRepository<TaskUser, Long> {

    Optional<TaskUser> findByUserId(Long userId);

    @Query("""
            SELECT t FROM TaskUser t WHERE t.userId =:userId
            """)
    List<TaskUser> findTaskUserByUserId(long userId);


    List<TaskUser> findByTask(Task task);


    boolean existsByUserIdAndTask_TaskId(long userId, Long taskId);

}