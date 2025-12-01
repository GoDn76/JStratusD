package org.godn.uploadservice.deployment;

import org.godn.uploadservice.exception.BadRequestException;
import org.godn.uploadservice.exception.ResourceNotFoundException;
import org.godn.uploadservice.exception.UnauthorizedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional // Ensures all DB operations are atomic
public class DeploymentService {

    private final DeploymentRepository deploymentRepository;
    private final ProjectSecretRepository projectSecretRepository;

    public DeploymentService(DeploymentRepository deploymentRepository, ProjectSecretRepository projectSecretRepository) {
        this.deploymentRepository = deploymentRepository;
        this.projectSecretRepository = projectSecretRepository;
    }

    // ==================================================================================
    // READ OPERATIONS
    // ==================================================================================
    public boolean exitsById(String id) {
        return deploymentRepository.existsById(id);
    }
    /**
     * Get a specific deployment entity.
     */
    public Deployment getDeployment(String id) {
        return deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment", "id", id));
    }

    /**
     * Get specific deployment DTO (for Controller).
     */
    public DeploymentResponseDto getDeploymentDto(String id) {
        return DeploymentMapper.toDto(getDeployment(id));
    }

    /**
     * Get ALL deployments for a user (History).
     */
    public List<DeploymentResponseDto> getAllDeployments(String userId) {
        return deploymentRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(DeploymentMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get only ACTIVE deployments (QUEUED or BUILDING).
     */
    public List<DeploymentResponseDto> getActiveDeployments(String userId) {
        List<DeploymentStatus> activeStatuses = List.of(DeploymentStatus.QUEUED, DeploymentStatus.BUILDING);
        return deploymentRepository.findAllByOwnerIdAndStatusIn(userId, activeStatuses)
                .stream()
                .map(DeploymentMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Idempotency Check: Checks if THIS user is already building THIS repo.
     */
    public Optional<DeploymentResponseDto> findActiveDeployment(String repoUrl, String userId) {
        return deploymentRepository.findActiveDeployment(repoUrl, userId)
                .map(DeploymentMapper::toDto);
    }

    // ==================================================================================
    // WRITE OPERATIONS
    // ==================================================================================

    public void saveDeployment(Deployment deployment) {
        deploymentRepository.save(deployment);
    }

    /**
     * Enforce strict limits: Max 1 concurrent build, Max 3 total projects.
     */
    public void checkDeploymentLimit(String userId) {
        // Rule 1: Max 1 Concurrent Build
        List<Deployment> active = deploymentRepository.findAllByOwnerIdAndStatusIn(
                userId, List.of(DeploymentStatus.QUEUED, DeploymentStatus.BUILDING));

        if (!active.isEmpty()) {
            throw new BadRequestException("You already have a deployment in progress. Please wait for it to finish.");
        }

        // Rule 2: Max 3 Total Projects
        long totalDeployments = deploymentRepository.countByOwnerId(userId);
        if (totalDeployments >= 3) {
            throw new BadRequestException("Free Tier Limit Reached: You can only have 3 deployments total. Delete an old one to deploy again.");
        }
    }

    /**
     * Cancel a running deployment.
     */
    public void cancelDeployment(String deploymentId, String userId) {
        Deployment deployment = getDeployment(deploymentId);

        // Security Check
        if (!deployment.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to cancel this deployment.");
        }

        // State Check
        if (deployment.getStatus() == DeploymentStatus.QUEUED || deployment.getStatus() == DeploymentStatus.BUILDING) {
            deployment.setStatus(DeploymentStatus.CANCELLED);
            deploymentRepository.save(deployment);
        } else {
            throw new BadRequestException("Cannot cancel a deployment that is already " + deployment.getStatus());
        }
    }

    /**
     * Delete a deployment and its secrets completely from the DB.
     */
    public void deleteDeployment(String deploymentId, String userId) {
        Deployment deployment = getDeployment(deploymentId);

        // Security Check
        if (!deployment.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to delete this deployment.");
        }

        // 1. Delete Secrets first (Referential Integrity)
        projectSecretRepository.deleteByProjectId(deploymentId);

        // 2. Delete Deployment
        deploymentRepository.delete(deployment);
    }

    // ==================================================================================
    // SECRET MANAGEMENT
    // ==================================================================================

    public void saveSecrets(String deploymentId, String userId, Map<String, String> secrets) {
        Deployment deployment = getDeployment(deploymentId);

        if (!deployment.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to manage secrets for this project.");
        }

        for (Map.Entry<String, String> entry : secrets.entrySet()) {
            String key = entry.getKey().trim();
            String value = entry.getValue().trim();

            Optional<ProjectSecret> existing = projectSecretRepository.findByProjectIdAndKey(deploymentId, key);

            if (existing.isPresent()) {
                ProjectSecret secret = existing.get();
                secret.setValue(value);
                projectSecretRepository.save(secret);
            } else {
                ProjectSecret newSecret = ProjectSecret.builder()
                        .projectId(deploymentId)
                        .key(key)
                        .value(value)
                        .build();
                projectSecretRepository.save(newSecret);
            }
        }
    }

    public Map<String, String> parseEnvFile(String envContent) {
        Map<String, String> secrets = new HashMap<>();
        String[] lines = envContent.split("\\r?\\n");
        for (String line : lines) {
            if (line.trim().isEmpty() || line.trim().startsWith("#")) continue;
            String[] parts = line.split("=", 2);
            if (parts.length == 2) {
                secrets.put(parts[0].trim(), parts[1].trim());
            }
        }
        return secrets;
    }
}