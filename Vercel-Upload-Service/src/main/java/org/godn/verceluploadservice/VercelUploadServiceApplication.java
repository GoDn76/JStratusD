package org.godn.verceluploadservice;

import org.godn.verceluploadservice.storage.S3Properties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(
        S3Properties.class
)
public class VercelUploadServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(VercelUploadServiceApplication.class, args);
    }

}
