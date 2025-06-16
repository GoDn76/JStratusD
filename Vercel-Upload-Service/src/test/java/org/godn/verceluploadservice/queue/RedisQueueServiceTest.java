package org.godn.verceluploadservice.queue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.junit.jupiter.api.Assertions.*;

class RedisQueueServiceTest {

    private RedisQueueService redisQueueService;

    @BeforeEach
    void setUp() {
        redisQueueService = new RedisQueueService(new StringRedisTemplate());
    }

    @AfterEach
    void tearDown() {
        // Clear the Redis queue after each test
        redisQueueService.popFromQueue();
    }

    @Test
    void should_successfully_pushToQueue() {
        // Given
        String uploadId = "ABC123";

        // When
        redisQueueService.pushToQueue(uploadId);

        // Then
        String poppedId = redisQueueService.popFromQueue();
        assertEquals(uploadId, poppedId);
    }

    @Test
    void popFromQueue() {
    }
}