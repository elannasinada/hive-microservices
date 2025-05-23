package com.gl.hive.ProjectService.model.dto;

import com.gl.hive.ProjectService.model.enums.JoinStatus;
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

    private String username;
    private String major;
    private String education;
    private List<String> role;
    private JoinStatus joinStatus;

}
