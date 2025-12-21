package org.godn.uploadservice.deployment;

import org.godn.uploadservice.exception.BadRequestException;
import org.godn.uploadservice.exception.ResourceNotFoundException;
import org.godn.uploadservice.exception.UnauthorizedException;
import org.godn.uploadservice.log.BuildLog;
import org.godn.uploadservice.log.BuildLogRepository;
import org.godn.uploadservice.storage.S3UploadService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;


import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional // Ensures all DB operations are atomic
public class DeploymentService {

    @Value("${upload.output.dir:output}")
    private String sourceCodeDir;

    private final DeploymentRepository deploymentRepository;
    private final ProjectSecretRepository projectSecretRepository;
    private final S3UploadService s3UploadService;
    private final BuildLogRepository buildLogRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public DeploymentService(
            DeploymentRepository deploymentRepository,
            ProjectSecretRepository projectSecretRepository,
            S3UploadService s3UploadService,
            BuildLogRepository buildLogRepository
            ) {
        this.deploymentRepository = deploymentRepository;
        this.projectSecretRepository = projectSecretRepository;
        this.s3UploadService = s3UploadService;
        this.buildLogRepository = buildLogRepository;
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
    @Transactional(readOnly = true)
    public Deployment getDeployment(String ownerId, String id) {
        return deploymentRepository.findByOwnerIdAndId(ownerId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment", "id", id));
    }

    /**
     * Get specific deployment DTO (for Controller).
     */
    @Transactional(readOnly = true)
    public DeploymentResponseDto getDeploymentDto(String ownerId, String id) {
        return DeploymentMapper.toDto(getDeployment(ownerId, id)); // Added OwnerId for security
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

    public List<BranchResponseDto> getBranches(String repoUrl, String accessToken) {

        // Added ?per_page=100 to get more branches
        String url = String.format("https://api.github.com/repos/%s/%s/branches?per_page=100",
                getRepoOwner(repoUrl),
                getRepoName(repoUrl));

        HttpHeaders headers = new HttpHeaders();
        if (accessToken != null && !accessToken.isEmpty()) {
            headers.setBearerAuth(accessToken);
        }
        headers.set("Accept", "application/vnd.github+json"); // Good practice for GitHub API

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<List<BranchResponseDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<BranchResponseDto>>() {}
            );
            return response.getBody();

        } catch (HttpClientErrorException.NotFound e) {
            // Repo doesn't exist or is private/hidden
            throw new BadRequestException("Repository not found. Check the URL or ensure you have access." +" Error = "+e);
        } catch (HttpClientErrorException.Unauthorized e) {
            // Token is invalid
            throw new BadRequestException("Invalid or expired GitHub token." +" Error = "+e);
        }
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
        Deployment deployment = getDeployment(userId, deploymentId);

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
        Deployment deployment = getDeployment(userId, deploymentId);

        // 1. Security Check
        if (!deployment.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to delete this deployment.");
        }

        // 2. Delete Secrets (DB)
        projectSecretRepository.deleteByProjectId(deploymentId);

        // 3. Delete Files (R2) - CLEANUP EVERYTHING
        // A. Delete Source Code (e.g. output/0E9L6/)
        s3UploadService.deleteFolder(sourceCodeDir + "/" + deploymentId);

        // B. Delete Live Site (e.g. live-sites/0E9L6/)
        s3UploadService.deleteFolder("live-sites/" + deploymentId);

        // 4. Delete Record (DB)
        deploymentRepository.delete(deployment);

        // 5. (Optional) Delete Build Logs if you implemented that tablew
         buildLogRepository.deleteByDeploymentId(deploymentId);
    }

    // ==================================================================================
    // SECRET MANAGEMENT
    // ==================================================================================

    public void saveSecrets(String deploymentId, String userId, Map<String, String> secrets) {
        Deployment deployment = getDeployment(userId, deploymentId);

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

    /**
     * NEW: Get build logs for a specific project.
     * Returns them sorted by timestamp so they read like a console.
     */
    public List<BuildLog> getDeploymentLogs(String deploymentId) {
        return buildLogRepository.findByDeploymentIdOrderByTimestampAsc(deploymentId);
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

    public String getRepoOwner(String repositoryUrl) {
        if (repositoryUrl == null) return null;
        String[] parts = repositoryUrl.split("/");
        // usually parts[3] is owner in a standard https github url
        return parts.length > 3 ? parts[3] : null;
    }

    private String getRepoName(String url) {
        if (url == null) return null;

        // Remove trailing slash if user added it
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }

        String[] parts = url.split("/");

        // Safety check
        if (parts.length < 5) return null;

        String repoName = parts[4]; // Index 4 is the repo name part

        // CRITICAL: Strip .git
        if (repoName.endsWith(".git")) {
            return repoName.substring(0, repoName.length() - 4);
        }

        return repoName;
    }
}