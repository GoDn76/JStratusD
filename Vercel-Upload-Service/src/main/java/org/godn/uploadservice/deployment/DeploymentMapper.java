package org.godn.uploadservice.deployment;


public class DeploymentMapper {

    public static DeploymentResponseDto toDto(Deployment deployment) {
        DeploymentResponseDto dto = new DeploymentResponseDto();
        dto.setId(deployment.getId());
        dto.setRepositoryUrl(deployment.getRepositoryUrl());
        dto.setStatus(deployment.getStatus().toString());
        dto.setCreatedAt(String.valueOf(deployment.getCreatedAt()));

        return dto;
    }
}
