package com.gl.hive.ProjectService.repository;

import com.gl.hive.ProjectService.model.entity.JoinProject;
import com.gl.hive.ProjectService.model.enums.JoinStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JoinProjectRepository extends JpaRepository<JoinProject, Long> {

    Optional<JoinProject> findByProject_ProjectIdAndUserId(Long projectId, Long userId);


    List<JoinProject> findByProject_ProjectIdAndStatus(Long projectId, JoinStatus status);

}