package com.gl.hive.shared.lib.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

    private Long userId;

    private String username;
    private String password;
    private String email;
    private boolean active = false;
    private Set<DepartmentsDTO> departments = new HashSet<>();
    private Set<RolesDTO> roles = new HashSet<>();

    public String getActualUsername() {
        return this.username;
    }

}
