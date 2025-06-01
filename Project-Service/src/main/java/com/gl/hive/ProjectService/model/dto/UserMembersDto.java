package com.gl.hive.ProjectService.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserMembersDto {

    private Long userId;
    private String username;
    private String major;
    private String education;
    private List<String> role;

}
