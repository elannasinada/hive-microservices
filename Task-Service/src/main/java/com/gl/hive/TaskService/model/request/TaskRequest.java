package com.gl.hive.TaskService.model.request;

import com.gl.hive.shared.lib.model.enums.TaskPriority;
import com.gl.hive.shared.lib.model.enums.TaskStatus;
import jakarta.validation.constraints.FutureOrPresent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TaskRequest {

    private String taskName;
    private String description;
    @FutureOrPresent
    private LocalDateTime dueDate;
    private TaskStatus taskStatus;
    private TaskPriority taskPriority;

}
