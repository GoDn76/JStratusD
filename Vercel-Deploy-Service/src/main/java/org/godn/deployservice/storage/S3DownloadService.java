package org.godn.deployservice.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;

import java.net.URI;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class S3DownloadService {
    private static final Logger logger = LoggerFactory.getLogger(S3DownloadService.class);
    private final S3Client s3Client;
    private final String bucketName;


    public S3DownloadService(S3Properties props) {
        this.bucketName = props.getBucketName();
//        System.out.println("Bucket Name: " + bucketName + ", Endpoint: " + props.getEndpoint() + ", Region: " + props.getRegion() + ", Access Key: " + props.getAccessKey() + ", Secret Key: " + props.getSecretKey());

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

    public List<String> listObjectKeys(String fileName) {
        ListObjectsV2Request request = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix(fileName)
                .build();

        ListObjectsV2Response listObjectsV2Response = s3Client.listObjectsV2(request);

        return listObjectsV2Response
                .contents()
                .stream()
                .map(S3Object::key)
                .collect(Collectors.toList());
    }

    @Async
    public CompletableFuture<GetObjectResponse> downloadFileFromR2(String fileName, String localFilePath) {
        GetObjectRequest getReq = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();
        int maxRetries = 3;
        for(int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                java.nio.file.Path localPath = java.nio.file.Paths.get(localFilePath);
                java.nio.file.Files.createDirectories(localPath.getParent());
                GetObjectResponse outRes = s3Client.getObject(
                        getReq,
                        localPath
                );
                logger.info("File Downloaded to: {}", localFilePath);
                return CompletableFuture.completedFuture(outRes);
            } catch (Exception ex) {
                logger.error("Download attempt {} failed for {}: {}", attempt, fileName, ex.getMessage());
                if (attempt == maxRetries) {
                    logger.error("Max retries reached. Upload failed for {}", fileName);
                    return CompletableFuture.failedFuture(ex);
                }
                try {
                    Thread.sleep(1000L * attempt); // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return CompletableFuture.failedFuture(ie);
                }
            }
        }
        return CompletableFuture.failedFuture(new RuntimeException("Unknown Download failure"));
    }
}
