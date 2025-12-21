    package org.godn.deployservice.deployment;


    import jakarta.persistence.*;
    import jakarta.validation.constraints.NotBlank;
    import jakarta.validation.constraints.NotNull;
    import jakarta.validation.constraints.Pattern;
    import jakarta.validation.constraints.Size;
    import lombok.AllArgsConstructor;
    import lombok.Builder;
    import lombok.Data;
    import lombok.NoArgsConstructor;
    import org.hibernate.validator.constraints.URL;

    import java.time.LocalDateTime;

    @Entity
    @Table(name = "deployments")
    @Data // Generates Getters, Setters, toString, equals, and hashCode
    @NoArgsConstructor // Generates the no-args constructor required by JPA
    @AllArgsConstructor // Generates a constructor with all fields
    @Builder // Enables the builder pattern (Deployment.builder().id(...).build())
    public class Deployment {
        @Id
        @NotNull(message = "Deployment ID cannot be null")
        @Pattern(regexp = "^[a-zA-Z0-9-]{5}$", message = "Deployment ID must be exactly 5 alphanumeric characters")
        private String id;

        private String lastCommitHash;

        @Column(nullable = false)
        @NotBlank(message = "Repository URL is required")
        // Basic Regex to ensure it looks like a URL (optional but recommended)
        @Pattern(regexp = "^(https?|git)(://|@)([^/]+)/(.+)$", message = "Invalid Repository URL format")
        private String repositoryUrl;

        @NotBlank(message = "Project name is required")
        @Size(min = 3, max = 50, message = "Project name must be between 3 and 50 characters")
        // Optional: Block dangerous HTML characters to prevent XSS in your dashboard
        @Pattern(regexp = "^[^<>]*$", message = "Project name cannot contain angle brackets (< >)")
        private String projectName;

        @URL
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
        private String branch = "main";

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
        public Deployment(String id, String projectName, String repositoryUrl, String ownerId) {
            this.id = id;
            this.projectName = projectName;
            this.repositoryUrl = repositoryUrl;
            this.ownerId = ownerId;
            this.status = DeploymentStatus.QUEUED;
            this.createdAt = LocalDateTime.now();
        }

        public Deployment(String id, String projectName, String repositoryUrl, String ownerId, String lastCommitHash, String branch) {
            this.id = id;
            this.lastCommitHash = lastCommitHash;
            this.projectName = projectName;
            this.repositoryUrl = repositoryUrl;
            this.ownerId = ownerId;
            this.status = DeploymentStatus.QUEUED;
            this.branch = branch;
            this.createdAt = LocalDateTime.now();
        }

        // Helper to extract "octocat" from "https://github.com/octocat/hello-world"
        public String getRepoOwner() {
            if (repositoryUrl == null) return null;
            String[] parts = repositoryUrl.split("/");
            // usually parts[3] is owner in a standard https github url
            return parts.length > 3 ? parts[3] : null;
        }

        // Helper to extract "hello-world"
        public String getRepoName() {
            if (repositoryUrl == null) return null;
            String[] parts = repositoryUrl.split("/");
            // usually parts[4] is repo name (remove .git if present)
            if (parts.length > 4) {
                return parts[4].replace(".git", "");
            }
            return null;
        }
    }
