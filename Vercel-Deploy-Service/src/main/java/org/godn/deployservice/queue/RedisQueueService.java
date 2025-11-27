package org.godn.deployservice.queue;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisQueueService {
    private final String QUEUE_KEY;
    private final StringRedisTemplate redisTemplate;
    public RedisQueueService(StringRedisTemplate redisTemplate, @Value("${queue.redis.key}") String queueKey) {
        this.QUEUE_KEY = queueKey;
        this.redisTemplate = redisTemplate;
    }

    public void pushToQueue(String uploadId) {
        redisTemplate.opsForList().rightPush(QUEUE_KEY, uploadId);
    }

    public String popFromQueue() {
        return redisTemplate.opsForList().leftPop(QUEUE_KEY);
    }

}
