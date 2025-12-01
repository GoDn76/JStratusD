package org.godn.uploadservice.queue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RedisQueueServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ListOperations<String, String> listOperations;

    private RedisQueueService redisQueueService;
    private final String QUEUE_KEY = "test_build_queue";

    @BeforeEach
    void setUp() {
        // Mock the opsForList() chain
        when(redisTemplate.opsForList()).thenReturn(listOperations);

        // Use constructor injection
        redisQueueService = new RedisQueueService(redisTemplate, QUEUE_KEY);
    }

    @Test
    void pushToQueue_ShouldAddToList() {
        String uploadId = "12345";

        redisQueueService.pushToQueue(uploadId);

        verify(listOperations).rightPush(QUEUE_KEY, uploadId);
    }
}