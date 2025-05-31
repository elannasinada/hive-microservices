package com.gl.hive.AuthenticationService.model.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.gl.hive.shared.lib.model.enums.Role;
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
public class Roles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roleId;

    @Enumerated(EnumType.STRING)
    private Role role;

    /* relationships */
    @ManyToMany(mappedBy = "roles", fetch = FetchType.EAGER)
    @JsonBackReference("user-roles")
    private Set<User> users = new HashSet<>();
    /* end of relationships */

}
