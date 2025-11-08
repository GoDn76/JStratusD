package org.godn.verceldeployservice.queue;

import jakarta.annotation.PreDestroy;
import org.godn.verceldeployservice.build.BuildService;
import org.godn.verceldeployservice.download.DownloadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.ExecutorService; // Added import
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class RedisListenerService {

    private static final Logger logger = LoggerFactory.getLogger(RedisListenerService.class);

    private final RedisQueueService redisQueueService;
    private final ScheduledExecutorService scheduledExecutor;
    private final ExecutorService buildExecutor; // Added for concurrent build limiting
    private final DownloadService downloadService;
    private final BuildService buildService;

    // Use a cross-platform base directory
    private final Path customTempBaseDir = Paths.get(System.getProperty("user.home"), "vercel-temp");

    /**
     * Constructor using only Dependency Injection.
     * @param executor The scheduled executor for polling Redis.
     * @param buildExecutor The dedicated, fixed-size thread pool for running builds.
     * @param redisQueueService The service for interacting with the Redis queue.
     * @param downloadService The service for downloading files from R2.
     * @param buildService The service for building the project.
     */
    public RedisListenerService(
            @Qualifier("redisTaskExecutor") ScheduledExecutorService executor,
            @Qualifier("buildExecutor") ExecutorService buildExecutor, // Injected the build executor
            RedisQueueService redisQueueService,
            DownloadService downloadService,
            BuildService buildService
    ) {
        this.scheduledExecutor = executor;
        this.buildExecutor = buildExecutor; // Assigned it
        this.redisQueueService = redisQueueService;
        this.downloadService = downloadService;
        this.buildService = buildService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startListening() {
        logger.info("Started RedisListenerService");
        scheduledExecutor.scheduleWithFixedDelay(this::run, 0, 1, TimeUnit.SECONDS);
    }

    /**
     * This run() method is now a fast poller.
     * It just pulls a job from Redis, creates a temp directory,
     * and submits the actual work to the buildExecutor.
     */
    private void run() {
        String id = redisQueueService.popFromQueue();
        if (id == null) {
            return; // No job in queue
        }

        logger.info("Received job for ID: {}. Submitting to build queue...", id);
        Path tempProjectDir = null;

        try {
            // Create the temp directory immediately
            if (!Files.exists(customTempBaseDir)) {
                Files.createDirectories(customTempBaseDir);
            }
            tempProjectDir = Files.createTempDirectory(customTempBaseDir, "build-" + id + "-");

            final Path finalTempProjectDir = tempProjectDir; // Final for use in lambda

            // Submit the entire build lifecycle to the buildExecutor.
            // This task will wait in a queue if all build threads (e.g., 2) are busy.
            buildExecutor.submit(() -> {
                try {
                    logger.info("[BUILD_START] ID: {}", id);

                    // 1. Download
                    // We .join() to wait for the async download to complete before proceeding.
                    downloadService.downloadR2Folder(id, finalTempProjectDir).join();
                    logger.info("[BUILD_DOWNLOADED] ID: {}", id);

                    // 2. Build & Upload
                    // This method now handles both building and uploading.
                    buildService.buildReactApp(finalTempProjectDir);
                    logger.info("[BUILD_SUCCESS] ID: {}", id);

                } catch (Exception e) {
                    // Log the build failure
                    logger.error("[BUILD_FAILED] ID: {}. Error: {}", id, e.getMessage());
                } finally {
                    // 3. Cleanup
                    // This cleanup runs *after* the build attempt, inside the build thread.
                    try {
                        logger.info("[BUILD_CLEANUP] ID: {}", id);
                        buildService.deleteDirectory(finalTempProjectDir.toFile());
                    } catch (Exception e) {
                        logger.error("[BUILD_CLEANUP_FAILED] ID: {}. Error: {}", id, e.getMessage());
                    }
                }
            });

        } catch (Exception e) {
            // This block catches errors from creating the temp dir or submitting the job.
            logger.error("Failed to create temp directory or submit job for ID: {}", id, e);
            if (tempProjectDir != null) {
                // If we created the dir but failed to submit, clean it up.
                try {
                    logger.warn("Cleaning up directory for failed submission: {}", tempProjectDir.toAbsolutePath());
                    buildService.deleteDirectory(tempProjectDir.toFile());
                } catch (Exception cleanupEx) {
                    logger.error("Failed to clean up directory after submission error", cleanupEx);
                }
            }
        }
    }

    @PreDestroy
    public void stopListening() {
        logger.info("Stopping RedisListenerService");
        scheduledExecutor.shutdown();
        buildExecutor.shutdown(); // Also shut down the build executor
        try {
            if (!scheduledExecutor.awaitTermination(10, TimeUnit.SECONDS)) {
                scheduledExecutor.shutdownNow();
            }
            if (!buildExecutor.awaitTermination(30, TimeUnit.SECONDS)) { // Give builds time to finish
                buildExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            logger.error("Shutdown interrupted", e);
            scheduledExecutor.shutdownNow();
            buildExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}