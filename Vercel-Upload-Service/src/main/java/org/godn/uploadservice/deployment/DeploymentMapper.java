package org.godn.uploadservice.deployment;


public class DeploymentMapper {

    public static DeploymentResponseDto toDto(Deployment deployment) {
        return new DeploymentResponseDto(
                deployment.getId(),
                deployment.getStatus().toString(),
                deployment.getRepositoryUrl(),
                deployment.getWebsiteUrl(), // <--- Map it here
                deployment.getCreatedAt()
        );
    }
}
