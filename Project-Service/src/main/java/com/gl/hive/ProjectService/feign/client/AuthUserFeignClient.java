package com.gl.hive.ProjectService.feign.client;

import com.gl.hive.shared.lib.model.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "4-AUTHENTICATION-SERVICE", path = "/api/v1/inter-communication", configuration = FeignClientConfiguration.class)
public interface AuthUserFeignClient {

    @GetMapping("/current-user-dto")
    UserDTO getCurrentUsers_DTO(@RequestHeader("Authorization") String authHeader);


    @GetMapping("/current-user-id")
    Long getCurrentUsers_Id(@RequestHeader("Authorization") String authHeader);


    @PostMapping("/add-leader-role/{userId}")
    ResponseEntity<String> addProjectLeaderRoleToUser(@PathVariable Long userId);


    @GetMapping("/project-leader-role-id")
    Long getProjectLeaderRoleId();


    @GetMapping("/get-user/{userId}")
    UserDTO getUserDTOById(@PathVariable Long userId);


    @PostMapping("/save-user-as-dto")
    UserDTO saveUserAndReturnSavedUserAsDTO(@RequestBody UserDTO userDTO);

}
