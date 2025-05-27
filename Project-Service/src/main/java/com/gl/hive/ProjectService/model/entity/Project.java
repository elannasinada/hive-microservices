package com.gl.hive.ProjectService.model.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projectId;

    private String projectName;
    private String description;
    @CreationTimestamp
    private LocalDate createdAt;
    @CreationTimestamp
    private LocalTime creationTime;
    private int memberCount;

    private int progress = 0;

    private LocalDate startDate;
    private LocalDate endDate;

    /* relationships */
    private Long leaderId;
    /* end of relationships */

    public void incrementMemberCount() {
        this.memberCount++;
    }

}
