package org.godn.uploadservice.deployment;

import org.godn.uploadservice.exception.BadRequestException;
import org.godn.uploadservice.exception.ResourceNotFoundException;
import org.godn.uploadservice.exception.UnauthorizedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DeploymentService {

    private final DeploymentRepository deploymentRepository;

    private static final int MAX_TOTAL_PROJECTS = 3;    // Only 3 deployments allowed total

    public DeploymentService(DeploymentRepository deploymentRepository) {
        this.deploymentRepository = deploymentRepository;
    }

    /**
     * Get a specific deployment.
     */
    public Deployment getDeployment(String id) {
        return deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment", "id", id));
    }

    /**
     * NEW: Get ALL deployments for a user (History).
     * This uses the method you noticed was missing!
     */
    public List<DeploymentResponseDto> getAllDeployments(String userId) {
        return deploymentRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(DeploymentMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get only ACTIVE deployments.
     */
    public List<DeploymentResponseDto> getActiveDeployments(String userId) {
        List<DeploymentStatus> activeStatuses = List.of(DeploymentStatus.QUEUED, DeploymentStatus.BUILDING);
        return deploymentRepository.findAllByOwnerIdAndStatusIn(userId, activeStatuses)
                .stream()
                .map(DeploymentMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Enforce strict limits.
     */
    public void checkDeploymentLimit(String userId) {
        // Rule 1: Max 1 Concurrent Build
        List<DeploymentResponseDto> active = getActiveDeployments(userId);
        if (!active.isEmpty()) {
            throw new BadRequestException("You already have a deployment in progress. Please wait for it to finish.");
        }

        // Rule 2: Max 3 Total Projects
        long totalDeployments = deploymentRepository.countByOwnerId(userId);
        if (totalDeployments >= MAX_TOTAL_PROJECTS) {
            throw new BadRequestException("Free Tier Limit Reached: You can only have " + MAX_TOTAL_PROJECTS + " deployments total. Delete an old one to deploy again.");
        }
    }

    /**
     * Cancel a deployment.
     */
    public void cancelDeployment(String userId, String id) {
        Deployment deployment = getDeployment(id);

        if (!deployment.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to cancel this deployment.");
        }

        if (deployment.getStatus() == DeploymentStatus.QUEUED || deployment.getStatus() == DeploymentStatus.BUILDING) {
            deployment.setStatus(DeploymentStatus.CANCELLED);
            deploymentRepository.save(deployment);
        } else {
            throw new BadRequestException("Cannot cancel a deployment that is already " + deployment.getStatus());
        }
    }

    public void saveDeployment(Deployment deployment) {
        deploymentRepository.save(deployment);
    }

    public Optional<DeploymentResponseDto> findActiveDeployment(String repoUrl, String userId) {
        return deploymentRepository.findActiveDeployment(repoUrl, userId)
                .map(DeploymentMapper::toDto);
    }

    public boolean existsById(String id) {
        return deploymentRepository.existsById(id);
    }
}