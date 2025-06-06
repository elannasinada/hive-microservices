package com.gl.hive.TaskService.fegin.client;

import com.gl.hive.shared.lib.exceptions.NotLeaderOfProjectException;
import com.gl.hive.shared.lib.exceptions.ResourceNotFoundException;
import com.gl.hive.shared.lib.model.dto.ProjectDTO;
import com.gl.hive.shared.lib.model.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "5-PROJECT-SERVICE/api/v1/project/inter-communication", configuration = FeignClientConfiguration.class)
public interface ProjectUtilFeignClient {

    @GetMapping("/is-member-of-project")
    boolean isMemberOfProject(@RequestParam long projectId, @RequestParam long userId) throws ResourceNotFoundException;


    @GetMapping("/is-leader-of-project")
    boolean isLeaderOrAdminOfProject(@RequestParam long projectId, @RequestParam long userId) throws NotLeaderOfProjectException, ResourceNotFoundException;


    @GetMapping("/project-dto/{projectId}")
    ProjectDTO getProjectAsDTO(@PathVariable long projectId) throws ResourceNotFoundException;


    @GetMapping("/get-user-association-with-task-and-project/{projectId}")
    List<UserDTO> getUsersAssociatedWithTaskAndProject(@PathVariable long projectId);
}
