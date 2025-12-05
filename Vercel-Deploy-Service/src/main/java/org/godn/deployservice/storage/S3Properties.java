package org.godn.deployservice.storage;


import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix="cloud.s3.bucket")
public class S3Properties {
    private String accessKey;
    private String secretKey;
    private String endpoint;
    private String bucketName;
    private String region;
}
