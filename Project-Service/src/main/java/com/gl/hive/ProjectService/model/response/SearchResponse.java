package com.gl.hive.ProjectService.model.response;

import com.gl.hive.ProjectService.model.dto.ProjectMembersDto;
import com.gl.hive.shared.lib.model.dto.CommentDTO;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SearchResponse {

    private Long projectId;

    private String projectName;
    private String leaderName;
    private String projectDescription;

    private ProjectMembersDto members;
    private List<CommentDTO> commentDTOs;

}
