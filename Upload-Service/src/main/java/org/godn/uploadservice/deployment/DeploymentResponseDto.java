package org.godn.uploadservice.deployment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeploymentResponseDto {
    private String id;
    private String status;
    private String repositoryUrl;
    private String websiteUrl; // <--- Add this
    private LocalDateTime createdAt;
}
