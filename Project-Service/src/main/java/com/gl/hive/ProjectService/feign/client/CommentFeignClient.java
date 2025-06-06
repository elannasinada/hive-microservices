package com.gl.hive.ProjectService.feign.client;

import com.gl.hive.shared.lib.model.dto.CommentDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "7-COMMENT-SERVICE", path = "/api/v1/inter-communication/comment", configuration = FeignClientConfiguration.class)
public interface CommentFeignClient {

    @GetMapping("/get-comments-as-dto-by-project-id/{projectId}")
    List<CommentDTO> getCommentListAsDTOs_ByProjectId(@PathVariable long projectId);

}
