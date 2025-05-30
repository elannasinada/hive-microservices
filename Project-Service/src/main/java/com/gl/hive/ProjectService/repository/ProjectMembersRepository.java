package com.gl.hive.ProjectService.repository;

import com.gl.hive.ProjectService.model.entity.Project;
import com.gl.hive.ProjectService.model.entity.ProjectMembers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProjectMembersRepository extends JpaRepository<ProjectMembers, Long> {
    @Query("""
             SELECT p FROM ProjectMembers p
             WHERE p.project =:project
            """)
    List<ProjectMembers> findByProject(Project project);


    @Query("""
            SELECT p FROM ProjectMembers p
            WHERE p.project.projectId =:projectId
            """)
    List<ProjectMembers> findByProject_ProjectId(Long projectId);

    Optional<ProjectMembers> findByProject_ProjectNameAndUserId(String projectName, Long userId);

    List<ProjectMembers> findByUserIdAndActiveTrue(Long userId);
    List<ProjectMembers> findByUserIdAndActiveFalse(Long userId);
    List<ProjectMembers> findByUserId(Long userId);

    List<ProjectMembers> findByProjectAndActiveTrue(Project project);
}