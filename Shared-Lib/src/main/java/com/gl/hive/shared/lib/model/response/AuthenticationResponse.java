package com.gl.hive.shared.lib.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {

    private String username;
    private List<String> roles;
    private List<String> rolesDescription;
    private String token;
    private boolean active;

}
