package com.gl.hive.ProjectService.model.response;

import com.gl.hive.ProjectService.model.enums.JoinStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JoinProjectResponse {

    private String projectName;
    private Long joinRequestId;
    private String joinRequestUsersEmail;
    private JoinStatus joinStatus;

}
