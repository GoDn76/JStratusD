package org.godn.uploadservice.deployment;

import jakarta.validation.Valid;
import org.godn.uploadservice.log.BuildLog;
import org.godn.uploadservice.upload.SecretsDto;
import org.godn.uploadservice.upload.UploadRequestDto;
import org.godn.uploadservice.upload.UploadResponseDto;
import org.godn.uploadservice.upload.UploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/deploys") // <--- Base Path for ALL endpoints
public class DeploymentController {

    private final UploadService uploadService;
    private final DeploymentService deploymentService;

    public DeploymentController(UploadService uploadService, DeploymentService deploymentService) {
        this.uploadService = uploadService;
        this.deploymentService = deploymentService;
    }

    // --- CORE DEPLOYMENT ENDPOINTS ---

    /**
     * Create (Upload) a new Deployment.
     * POST /deployments
     */
    @PostMapping
    public ResponseEntity<UploadResponseDto> createDeployment(
            @Valid @RequestBody UploadRequestDto request,
            @RequestHeader("X-User-Id") String userId
    ) {
        String projectId = uploadService.uploadProject(request, userId);
        return ResponseEntity.ok(new UploadResponseDto(true, "Deployment Queued", projectId));
    }

    /**
     * Get All Deployments for the User (History).
     * GET /deployments
     */
    @GetMapping
    public ResponseEntity<List<DeploymentResponseDto>> getAllDeployments(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(deploymentService.getAllDeployments(userId));
    }

    /**
     * Get only ACTIVE Deployments.
     * GET /deployments/active
     */
    @GetMapping("/active")
    public ResponseEntity<List<DeploymentResponseDto>> getActiveDeployments(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(deploymentService.getActiveDeployments(userId));
    }

    /**
     * Get details of a specific Deployment.
     * GET /deployments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<DeploymentResponseDto> getDeployment(@PathVariable String id) {
        return ResponseEntity.ok(deploymentService.getDeploymentDto(id));
    }

    // --- ACTIONS ---

    /**
     * Cancel a running build.
     * POST /deployments/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<String> cancelDeployment(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId
    ) {
        deploymentService.cancelDeployment(id, userId);
        return ResponseEntity.ok("Deployment cancelled successfully.");
    }

    /**
     * Delete a project history completely.
     * DELETE /deployments/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDeployment(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId
    ) {
        deploymentService.deleteDeployment(id, userId);
        return ResponseEntity.ok("Deployment deleted successfully.");
    }

    /**
     * Get Build Logs.
     * GET /deployments/{id}/logs
     */
    @GetMapping("/{id}/logs")
    public ResponseEntity<List<BuildLog>> getDeploymentLogs(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId
    ) {
        // 1. Security Check: Ensure user owns this deployment
        Deployment deployment = deploymentService.getDeployment(id);
        if (!deployment.getOwnerId().equals(userId)) {
            // Or throw new UnauthorizedException(...)
            return ResponseEntity.status(403).build();
        }

        // 2. Fetch Logs
        List<BuildLog> logs = deploymentService.getDeploymentLogs(id);
        return ResponseEntity.ok(logs);
    }
}