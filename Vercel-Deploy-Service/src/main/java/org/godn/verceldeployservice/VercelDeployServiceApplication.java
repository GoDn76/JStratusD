package org.godn.verceldeployservice;

import org.godn.verceldeployservice.storage.S3Properties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(
        S3Properties.class
)
public class VercelDeployServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(VercelDeployServiceApplication.class, args);
    }

}
