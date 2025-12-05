package org.godn.deployservice.deployment;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "deployments")
@Data // Generates Getters, Setters, toString, equals, and hashCode
@NoArgsConstructor // Generates the no-args constructor required by JPA
@AllArgsConstructor // Generates a constructor with all fields
@Builder // Enables the builder pattern (Deployment.builder().id(...).build())
public class Deployment {
    @Id
    // Ensure ID is not null and has exactly 5 characters (based on your logic)
    @NotNull(message = "Deployment ID cannot be null")
    @Pattern(regexp = "^[a-zA-Z0-9-]{5}$", message = "Deployment ID must be exactly 5 alphanumeric characters")
    private String id;

    @Column(nullable = false)
    @NotBlank(message = "Repository URL is required")
    // Basic Regex to ensure it looks like a URL (optional but recommended)
    @Pattern(regexp = "^(https?|git)(://|@)([^/]+)/(.+)$", message = "Invalid Repository URL format")
    private String repositoryUrl;

    private String websiteUrl;

    @Column(nullable = false)
    @NotBlank(message = "Owner ID is required")
    private String ownerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Status cannot be null")
    @Builder.Default
    private DeploymentStatus status = DeploymentStatus.QUEUED;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Custom constructor for service convenience
    public Deployment(String id, String repositoryUrl, String ownerId) {
        this.id = id;
        this.repositoryUrl = repositoryUrl;
        this.ownerId = ownerId;
        this.status = DeploymentStatus.QUEUED;
        this.createdAt = LocalDateTime.now();
    }
}
