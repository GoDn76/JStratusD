package org.godn.deployservice.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Configuration
public class ExecutorConfig {

    @Bean(name = "redisTaskExecutor")
    public ScheduledExecutorService taskExecutor(){
        return Executors.newSingleThreadScheduledExecutor();
    }

    /**
     * This bean creates a dedicated thread pool for running build jobs.
     * We use newFixedThreadPool to limit concurrency.
     */
    @Bean("buildExecutor")
    public ExecutorService buildExecutor() {
        // Sets the maximum number of builds that can run at the same time.
        int concurrentBuilds = 3;

        return Executors.newFixedThreadPool(concurrentBuilds);
    }
}
