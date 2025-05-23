package com.gl.hive.ProjectService.model.entity;

import com.gl.hive.ProjectService.model.enums.JoinStatus;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity for sending join project request to a Project - PROJECT_LEADER.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class JoinProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long joinRequestId;

    /* relationships */
    @ManyToOne(fetch = FetchType.EAGER)
    private Project project;

    private Long userId;
    /* end of relationships */

    private JoinStatus status;

    public JoinProject(Project project, Long userId, JoinStatus status) {
        this.project = project;
        this.userId = userId;
        this.status = status;
    }

}
