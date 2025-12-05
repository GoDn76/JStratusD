package org.godn.deployservice.queue;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.godn.deployservice.deployment.DeploymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class RedisListenerService {

    private static final Logger logger = LoggerFactory.getLogger(RedisListenerService.class);

    private final RedisQueueService redisQueueService;
    private final ScheduledExecutorService scheduledExecutor;
    private final ExecutorService buildExecutor;
    private final DeploymentService deploymentService;
    private final String workerBaseUrl; // Stored here

    public RedisListenerService(
            @Value("${worker.website-url}") String workerBaseUrl,
            @Qualifier("redisTaskExecutor") ScheduledExecutorService executor,
            @Qualifier("buildExecutor") ExecutorService buildExecutor,
            RedisQueueService redisQueueService,
            DeploymentService deploymentService
    ) {
        this.workerBaseUrl = workerBaseUrl; // Inject from application.yml
        this.scheduledExecutor = executor;
        this.buildExecutor = buildExecutor;
        this.redisQueueService = redisQueueService;
        this.deploymentService = deploymentService;
    }

    @PostConstruct
    public void checkRedisConnection() {
        try {
            logger.info("Checking Redis connection...");
            redisQueueService.getQueueSize();
            logger.info("✅ Redis connection established successfully.");
        } catch (Exception e) {
            logger.error("❌ FATAL: Could not connect to Redis.", e);
            throw new RuntimeException("Redis connection failed", e);
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startListening() {
        logger.info("Started RedisListenerService Polling");
        scheduledExecutor.scheduleWithFixedDelay(this::run, 0, 1, TimeUnit.SECONDS);
    }

    private void run() {
        String id = redisQueueService.popFromQueue();
        if (id != null) {
            // --- PASS THE URL TO THE SERVICE ---
            deploymentService.processDeployment(id, workerBaseUrl);
        }
    }

    @PreDestroy
    public void stopListening() {
        logger.info("Stopping RedisListenerService");
        scheduledExecutor.shutdown();
        buildExecutor.shutdown();
        try {
            if (!scheduledExecutor.awaitTermination(10, TimeUnit.SECONDS)) scheduledExecutor.shutdownNow();
            if (!buildExecutor.awaitTermination(30, TimeUnit.SECONDS)) buildExecutor.shutdownNow();
        } catch (InterruptedException e) {
            scheduledExecutor.shutdownNow();
            buildExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}