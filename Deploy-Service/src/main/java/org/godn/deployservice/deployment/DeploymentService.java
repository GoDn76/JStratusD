package org.godn.deployservice.deployment;

import org.godn.deployservice.build.BuildService;
import org.godn.deployservice.download.DownloadService;
import org.godn.deployservice.log.BuildLog;
import org.godn.deployservice.log.BuildLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

@Service
public class DeploymentService {
    private static final Logger logger = LoggerFactory.getLogger(DeploymentService.class);

    private final ExecutorService buildExecutor;
    private final DownloadService downloadService;
    private final BuildService buildService;
    private final DeploymentRepository deploymentRepository;
    private final ProjectSecretRepository projectSecretRepository; // <--- 1. NEW DEPENDENCY

    private static final long DEPLOYMENT_TIMEOUT_MINUTES = 20;
    private final Path customTempBaseDir = Paths.get(System.getProperty("user.home"), "vercel-temp");
    private final BuildLogRepository buildLogRepository;

    public DeploymentService(
            @Qualifier("buildExecutor") ExecutorService buildExecutor,
            DownloadService downloadService,
            BuildService buildService,
            DeploymentRepository deploymentRepository,
            ProjectSecretRepository projectSecretRepository, // <--- 2. INJECT HERE
            BuildLogRepository buildLogRepository) {
        this.buildExecutor = buildExecutor;
        this.downloadService = downloadService;
        this.buildService = buildService;
        this.deploymentRepository = deploymentRepository;
        this.projectSecretRepository = projectSecretRepository;
        this.buildLogRepository = buildLogRepository;
    }

    public void processDeployment(String id, String workerBaseUrl) {
        int rowsUpdated = deploymentRepository.lockDeployment(id);
        if (rowsUpdated == 0) {
            logger.warn("Job {} skipped (Already building or cancelled).", id);
            return;
        }

        logger.info("Job {} locked. Status set to BUILDING.", id);

        buildExecutor.submit(() -> executeBuildWithTimeout(id, workerBaseUrl));
    }

    private void executeBuildWithTimeout(String id, String workerBaseUrl) {
        Path tempProjectDir = null;
        try {
            if (!Files.exists(customTempBaseDir)) Files.createDirectories(customTempBaseDir);
            tempProjectDir = Files.createTempDirectory(customTempBaseDir, "build-" + id + "-");
            final Path finalDir = tempProjectDir;

            CompletableFuture<Void> buildTask = CompletableFuture.runAsync(() -> {
                logger.info("[BUILD_START] ID: {}", id);

                // A. Download Source
                downloadService.downloadR2Folder(id, finalDir).join();

                // B. Fetch Secrets from DB
                Map<String, String> envVars = getSecretsForProject(id);
                logger.info("Fetched {} environment variables for build.", envVars.size());

                // C. Build & Upload (With Secrets!)
                try {
                    buildService.buildReactApp(finalDir, id, envVars); // <--- 3. PASS SECRETS
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }, buildExecutor);

            buildTask.get(DEPLOYMENT_TIMEOUT_MINUTES, TimeUnit.MINUTES);

            String finalSiteUrl = workerBaseUrl + "/view/" + id;
            updateStatus(id, DeploymentStatus.READY, finalSiteUrl);
            saveCompletionLog("🚀 Successfully deployed site!", id, LocalDateTime.now());
            logger.info("[BUILD_SUCCESS] ID: {} is live at {}", id, finalSiteUrl);

        } catch (TimeoutException e) {
            logger.error("❌ [TIMEOUT] Deployment {} took longer than {} mins.", id, DEPLOYMENT_TIMEOUT_MINUTES);
            updateStatus(id, DeploymentStatus.TIMED_OUT, null);
        } catch (Exception e) {
            logger.error("❌ [FAILED] Deployment {} failed: {}", id, e.getMessage());
            updateStatus(id, DeploymentStatus.FAILED, null);
        } finally {
            if (tempProjectDir != null) {
                try {
                    buildService.deleteDirectory(tempProjectDir.toFile());
                    logger.info("[CLEANUP] Removed temp dir for {}", id);
                } catch (Exception ex) {
                    logger.error("Cleanup failed for {}", id, ex);
                }
            }
        }
    }

    private Map<String, String> getSecretsForProject(String projectId) {
        List<ProjectSecret> secrets = projectSecretRepository.findByProjectId(projectId);
        return secrets.stream()
                .collect(Collectors.toMap(ProjectSecret::getKey, ProjectSecret::getValue));
    }

    private void updateStatus(String id, DeploymentStatus status, String websiteUrl) {
        deploymentRepository.findById(id).ifPresent(d -> {
            d.setStatus(status);
            if (websiteUrl != null) {
                d.setWebsiteUrl(websiteUrl);
            }
            deploymentRepository.save(d);
        });
    }
    private void saveCompletionLog(String completionMsg, String deploymentId, LocalDateTime completionTime) {
        BuildLog buildLog = new BuildLog();
        buildLogRepository.save(BuildLog.builder()
                .deploymentId(deploymentId)
                .content(completionMsg)
                .timestamp(completionTime)
                .build());
    }
}