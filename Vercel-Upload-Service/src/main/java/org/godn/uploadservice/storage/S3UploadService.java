package org.godn.uploadservice.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.net.URI;
import java.nio.file.Paths;

@Service
public class S3UploadService {
    private static final Logger logger = LoggerFactory.getLogger(S3UploadService.class);
    private final S3Client s3Client;
    private final String bucketName;


    public S3UploadService(S3Properties props) {
        this.bucketName = props.getBucketName();
        AwsBasicCredentials awsCreds = AwsBasicCredentials.create(
                props.getAccessKey(),
                props.getSecretKey()
        );

        this.s3Client = S3Client.builder().credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                .endpointOverride(URI.create(props.getEndpoint()))
                .region(Region.of(props.getRegion()))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build()
                ).build();
    }

    public PutObjectResponse uploadFileToR2(String fileName, String localFilePath) throws InterruptedException {
        PutObjectRequest putReq = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();

        int maxRetries = 3;
        for(int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                PutObjectResponse outRes = s3Client.putObject(
                        putReq,
                        Paths.get(localFilePath)
                );
                logger.info("File uploaded: {}", fileName);
                return outRes;
            } catch (Exception ex) {
                logger.error("Upload attempt {} failed for {}: {}", attempt, fileName, ex.getMessage());
                if (attempt == maxRetries) {
                    logger.error("Max retries reached. Upload failed for {}", fileName);
                    throw ex;
                }
                try {
                    Thread.sleep(1000L * attempt); // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw ie;
                }
            }
        }
        throw new RuntimeException("Unknown upload failure");
    }
}
