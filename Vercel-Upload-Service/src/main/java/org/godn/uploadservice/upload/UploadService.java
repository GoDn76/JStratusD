package org.godn.uploadservice.upload;

import org.eclipse.jgit.api.Git;
import org.godn.uploadservice.deployment.Deployment;
import org.godn.uploadservice.deployment.DeploymentResponseDto;
import org.godn.uploadservice.deployment.DeploymentService;
import org.godn.uploadservice.deployment.DeploymentStatus;
import org.godn.uploadservice.queue.RedisQueueService;
import org.godn.uploadservice.storage.S3UploadService;
import org.godn.uploadservice.util.GenerateId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Stream;

@Service
public class UploadService {
    private static final Logger logger = LoggerFactory.getLogger(UploadService.class);

    private final S3UploadService s3UploadService;
    private final RedisQueueService redisQueueService;
    private final DeploymentService deploymentService;

    // Self-inject to allow calling @Async methods from within the same class
    @Autowired
    @Lazy
    private UploadService self;

    @Value("${upload.output.dir:source-codes}") // Default bucket folder
    private String s3BaseFolder;

    public UploadService(S3UploadService s3UploadService, RedisQueueService redisQueueService, DeploymentService deploymentService) {
        this.s3UploadService = s3UploadService;
        this.redisQueueService = redisQueueService;
        this.deploymentService = deploymentService;
    }

    /**
     * 1. SYNCHRONOUS PHASE: Validation & DB Entry
     * Returns the ID immediately to the user.
     */
    public String uploadProject(UploadRequestDto requestDto, String userId) {
        // A. Check Limits
        deploymentService.checkDeploymentLimit(userId);

        // B. Idempotency Check
        Optional<DeploymentResponseDto> active = deploymentService.findActiveDeployment(requestDto.getRepoUrl(), userId);
        if (active.isPresent()) {
            logger.info("Returning existing active deployment {} for user {}", active.get().getId(), userId);
            return active.get().getId();
        }

        // C. Generate ID (With Collision Check Loop)
        // ---------------------------------------------------------
        String projectId;
        int attempts = 0;
        do {
            projectId = GenerateId.create();
            attempts++;
            // Safety valve to prevent infinite loops (e.g. if DB is 100% full)
            if (attempts > 10) {
                throw new RuntimeException("Failed to generate a unique Project ID after 10 attempts.");
            }
        } while (deploymentService.exitsById(projectId)); // Keep retrying if ID exists
        // ---------------------------------------------------------

        // D. Save "QUEUED" state to DB
        Deployment deployment = new Deployment(projectId, requestDto.getRepoUrl(), userId);
        deploymentService.saveDeployment(deployment);

        // E. Trigger Async
        self.processRepoInBackground(projectId, requestDto.getRepoUrl());

        return projectId;
    }

    /**
     * 2. ASYNCHRONOUS PHASE: Cloning & Uploading
     * Runs in a background thread.
     */
    @Async
    public void processRepoInBackground(String projectId, String repoUrl) {
        Path tempDir = null;
        logger.info("Starting background processing for project: {}", projectId);

        try {
            // 1. Create Temp Directory
            tempDir = Files.createTempDirectory("upload-service-" + projectId + "-");
            File targetDir = tempDir.toFile();

            // 2. Clone Git Repo (Auto-closes via try-with-resources)
            logger.info("Cloning repository: {}", repoUrl);
            try (Git git = Git.cloneRepository()
                    .setURI(repoUrl)
                    .setDirectory(targetDir)
                    .call()) {
                logger.info("Repository cloned successfully for ID: {}", projectId);
            }

            // 3. Walk files
            List<Path> filePaths;
            try (Stream<Path> walk = Files.walk(tempDir)) {
                filePaths = walk.filter(Files::isRegularFile).toList();
            }

            Path finalTempDir = tempDir;

            // 4. Queue up Parallel S3 Uploads
            List<CompletableFuture<Void>> uploadFutures = filePaths.stream()
                    .map(path -> {
                        String relativePath = finalTempDir.relativize(path).toString().replace(File.separatorChar, '/');
                        if (relativePath.startsWith(".git/") || relativePath.equals(".git")) return null;

                        String s3Key = s3BaseFolder + "/" + projectId + "/" + relativePath;

                        // CRITICAL: This lambda must BLOCK until the upload is actually finished.
                        return CompletableFuture.runAsync(() -> {
                            try {
                                s3UploadService.uploadFileToR2(s3Key, path.toString());
                            } catch (InterruptedException e) {
                                throw new RuntimeException(e);
                            }
                        });
                    })
                    .filter(Objects::nonNull)
                    .toList();

            // 5. Wait for ALL uploads to settle (Success or Failure)
            CompletableFuture.allOf(uploadFutures.toArray(new CompletableFuture[0]))
                    .handle((res, ex) -> {
                        if (ex != null) {
                            throw new RuntimeException("Upload failed", ex);
                        }
                        return res;
                    }).join(); // This will now actually wait for the files to upload

            logger.info("All source files uploaded to S3 for ID: {}", projectId);

            // 6. Push to Redis (Hand off to Deploy Service)
            redisQueueService.pushToQueue(projectId);
            logger.info("Deployment ID {} pushed to Redis queue", projectId);

        } catch (Exception e) {
            logger.error("Failed to process deployment {}", projectId, e);
            updateStatusToFailed(projectId);
        } finally {
            // 7. Cleanup
            // Only runs after ALL upload threads have finished/crashed
            if (tempDir != null) {
                cleanupDirectory(tempDir);
            }
        }
    }

    private void updateStatusToFailed(String id) {
        try {
            Deployment d = deploymentService.getDeployment(id);
            d.setStatus(DeploymentStatus.FAILED);
            deploymentService.saveDeployment(d);
        } catch (Exception ex) {
            logger.error("Could not update status to FAILED for {}", id, ex);
        }
    }

    private void cleanupDirectory(Path dirPath) {
        try {
            try (Stream<Path> walk = Files.walk(dirPath)) {
                walk.sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            }
            logger.info("Cleaned up temp directory: {}", dirPath);
        } catch (IOException e) {
            logger.warn("Could not fully clean up temp dir {}: {}", dirPath, e.getMessage());
        }
    }

}