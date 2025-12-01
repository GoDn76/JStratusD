package org.godn.uploadservice.deployment;

import jakarta.validation.Valid;
import org.godn.uploadservice.upload.SecretsDto;
import org.godn.uploadservice.upload.UploadRequestDto;
import org.godn.uploadservice.upload.UploadResponseDto;
import org.godn.uploadservice.upload.UploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class DeploymentController {

    private final UploadService uploadService;
    private final DeploymentService deploymentService;

    public DeploymentController(UploadService uploadService, DeploymentService deploymentService) {
        this.uploadService = uploadService;
        this.deploymentService = deploymentService;
    }

    // --- CORE DEPLOYMENT ENDPOINTS ---

    @PostMapping("/deploy")
    public ResponseEntity<UploadResponseDto> createDeployment(
            @Valid @RequestBody UploadRequestDto request,
            @RequestHeader("X-User-Id") String userId
    ) {
        String projectId = uploadService.uploadProject(request, userId);
        return ResponseEntity.ok(new UploadResponseDto(true, "Deployment Queued", projectId));
    }

    @GetMapping("/deployments")
    public ResponseEntity<List<DeploymentResponseDto>> getAllDeployments(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(deploymentService.getAllDeployments(userId));
    }

    @GetMapping("/active")
    public ResponseEntity<List<DeploymentResponseDto>> getActiveDeployments(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(deploymentService.getActiveDeployments(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeploymentResponseDto> getDeployment(@PathVariable String id) {
        // Note: This endpoint is public so anyone can see status if they have ID.
        // Add userId check if you want it private.
        return ResponseEntity.ok(deploymentService.getDeploymentDto(id));
    }

    // --- ACTIONS ---

    /**
     * Cancel a running build.
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
     * Delete a project history completely (frees up limit).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDeployment(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId
    ) {
        deploymentService.deleteDeployment(id, userId);
        return ResponseEntity.ok("Deployment deleted successfully.");
    }

    // --- SECRETS ---

    @PostMapping("/{id}/secrets")
    public ResponseEntity<String> addSecrets(
            @PathVariable String id,
            @RequestBody SecretsDto secretsDto,
            @RequestHeader("X-User-Id") String userId
    ) {
        deploymentService.saveSecrets(id, userId, secretsDto.getSecrets());
        return ResponseEntity.ok("Secrets saved successfully.");
    }

    @PostMapping("/{id}/secrets/raw")
    public ResponseEntity<String> addRawSecrets(
            @PathVariable String id,
            @RequestBody String envContent,
            @RequestHeader("X-User-Id") String userId
    ) {
        Map<String, String> secrets = deploymentService.parseEnvFile(envContent);
        deploymentService.saveSecrets(id, userId, secrets);
        return ResponseEntity.ok("Secrets parsed and saved successfully.");
    }
}