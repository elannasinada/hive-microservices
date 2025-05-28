package com.gl.hive.shared.lib.model.dto;

import com.gl.hive.shared.lib.model.enums.Department;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentsDTO {
    private Long departmentId;
    private Department department;
}
