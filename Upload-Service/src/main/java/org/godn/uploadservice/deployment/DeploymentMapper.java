package org.godn.uploadservice.deployment;


public class DeploymentMapper {

    public static DeploymentResponseDto toDto(Deployment deployment) {
        return new DeploymentResponseDto(
                deployment.getId(),
                deployment.getProjectName(),
                deployment.getLastCommitHash(),
                deployment.getStatus().toString(),
                deployment.getRepositoryUrl(),
                deployment.getBranch(),
                deployment.getWebsiteUrl(), // <--- Map it here
                deployment.getCreatedAt()
        );
    }
}
