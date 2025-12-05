package org.godn.uploadservice.deployment;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "project_secrets", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"projectId", "key"}) // Prevent duplicate keys for same project
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSecret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectId; // Linked to the Deployment ID

    @Column(nullable = false)
    private String key; // e.g., "DATABASE_URL"

    @Column(nullable = false)
    private String value; // e.g., "postgres://..."
}