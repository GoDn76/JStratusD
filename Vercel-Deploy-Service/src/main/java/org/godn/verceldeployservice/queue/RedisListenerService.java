package org.godn.verceldeployservice.queue;


import jakarta.annotation.PreDestroy;
import org.godn.verceldeployservice.download.DownloadService;
import org.godn.verceldeployservice.storage.S3DownloadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class RedisListenerService {

    private static final Logger logger = LoggerFactory.getLogger(RedisListenerService.class);
    private final RedisQueueService redisQueueService;
    private final ScheduledExecutorService scheduledExecutor;
    private final DownloadService downloadService;

    public RedisListenerService(
            @Qualifier("redisTaskExecutor") ScheduledExecutorService executor,
            RedisQueueService redisQueueService,
            DownloadService downloadService) {
        this.scheduledExecutor = executor;
        this.redisQueueService = redisQueueService;
        this.downloadService = downloadService;
    }



    @EventListener(ApplicationReadyEvent.class)
    public void startListening(){
        logger.info("Starting RedisListenerService");
        scheduledExecutor.scheduleWithFixedDelay(this::run, 0, 1, TimeUnit.MICROSECONDS);
    }

    private void run() {
        try {

            String id = redisQueueService.popFromQueue();
            if (id != null) {
                logger.info("Deploying ID: {}", id);
                downloadService.downloadR2Folder(id).whenComplete((result, throwable) -> {
                    if (throwable != null) {
                        logger.error("Error during download for ID {}: {}", id, throwable.getMessage());
                    } else {
                        logger.info("Successfully downloaded files for ID: {}", id);
                    }
                });
            }
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }
    }

    @PreDestroy
    public void stopListening(){
        logger.info("Stopping RedisListenerService");
        scheduledExecutor.shutdown();
        try{
            if (!scheduledExecutor.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS)) {
                logger.warn("Executor did not terminate in the specified time.");
                scheduledExecutor.shutdownNow();
            }
        }catch (InterruptedException e) {
            logger.error("Shutdown interrupted", e);
            scheduledExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
