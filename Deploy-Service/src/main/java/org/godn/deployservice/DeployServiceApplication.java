package org.godn.deployservice;

import org.godn.deployservice.storage.S3Properties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(
        S3Properties.class
)
public class DeployServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeployServiceApplication.class, args);
    }

}
