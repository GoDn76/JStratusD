package org.godn.uploadservice.deployment;

import jakarta.validation.Valid;
import org.godn.uploadservice.upload.UploadRequestDto;
import org.godn.uploadservice.upload.UploadResponseDto;
import org.godn.uploadservice.upload.UploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/deploy")
public class DeploymentController {
    private final UploadService uploadService;
    private final DeploymentService deploymentService;

    public DeploymentController(
            UploadService uploadService,
            DeploymentService deploymentService
            ) {
        this.uploadService = uploadService;
        this.deploymentService = deploymentService;
    }

    @PostMapping
    public ResponseEntity<UploadResponseDto> uploadRepo(
            @Valid @RequestBody UploadRequestDto uploadRequestDto,
            @RequestHeader("X-User-Id") String userId
    )
    {
        String projectId = uploadService.uploadProject(uploadRequestDto, userId);
        return ResponseEntity.ok(new UploadResponseDto(true, "Deployment Queued", projectId));
    }

//    @GetMapping("deployment")
//    public ResponseEntity<List<DeploymentResponseDto>> getAllDeployments(@RequestHeader("X-User-Id") String userId) {
//
//    }


    @GetMapping("deployment")
    public ResponseEntity<Deployment> getDeploymentStatus(@RequestParam("id") String deploymentId) {
        Deployment deployment = deploymentService.getDeployment(deploymentId);
        return ResponseEntity.ok(deployment);
    }


}
