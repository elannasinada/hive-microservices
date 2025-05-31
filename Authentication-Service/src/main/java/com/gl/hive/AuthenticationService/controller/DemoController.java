package com.gl.hive.AuthenticationService.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/authenticated")
public class DemoController {

    @GetMapping("/pl")
    @PreAuthorize("hasAnyRole('PROJECT_LEADER', 'ADMIN')")  // Updated to allow admins
    public String projectLeaderEndpoint() {
        return "PROJECT_LEADER :: Access granted";
    }

    @GetMapping("/pa")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public String adminEndpoint() {
        return "ADMIN :: Access granted";
    }

    @GetMapping("/tm")
    @PreAuthorize("hasAnyRole('TEAM_MEMBER', 'ADMIN')")  // Updated to allow admins
    public String teamMemberEndpoint() {
        return "TEAM_MEMBER :: Access granted";
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('PROJECT_LEADER', 'ADMIN', 'TEAM_MEMBER')")
    public String allRolesEndpoint() {
        return "All roles :: Access granted";
    }

    @GetMapping("/verify")
    @PreAuthorize("isAuthenticated()")
    public String verifyToken() {
        return "Token is valid";
    }
}