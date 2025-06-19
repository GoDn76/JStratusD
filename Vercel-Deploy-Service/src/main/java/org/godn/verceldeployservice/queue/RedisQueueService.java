package org.godn.verceldeployservice.queue;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisQueueService {
    private static final String QUEUE_KEY = "build-queue";

    private final StringRedisTemplate redisTemplate;
    public RedisQueueService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void pushToQueue(String uploadId) {
        redisTemplate.opsForList().rightPush(QUEUE_KEY, uploadId);
    }

    public String popFromQueue() {
        return redisTemplate.opsForList().leftPop(QUEUE_KEY);
    }

}
