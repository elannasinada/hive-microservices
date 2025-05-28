package com.gl.hive.AuthenticationService.model.entity;

import com.gl.hive.shared.lib.model.enums.Department;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Departments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long departmentId;

    @Enumerated(EnumType.STRING)
    private Department department;

    /* relationships */
    @ManyToMany(mappedBy = "departments", fetch = FetchType.EAGER)
    @Builder.Default
    private Set<User> users = new HashSet<>();
    /* end of relationships */

}
