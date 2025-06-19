package org.godn.verceldeployservice.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Configuration
public class ExecutorConfig {

    @Bean(name = "redisTaskExecutor")
    public ScheduledExecutorService taskExecutor(){
        return Executors.newSingleThreadScheduledExecutor();
    }
}
