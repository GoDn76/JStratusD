package org.godn.deployservice.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class S3DownloadService {
    private static final Logger logger = LoggerFactory.getLogger(S3DownloadService.class);
    private final S3Client s3Client;
    private final String bucketName;

    public S3DownloadService(S3Properties props) {
        this.bucketName = props.getBucketName();
        AwsBasicCredentials awsCreds = AwsBasicCredentials.create(
                props.getAccessKey(),
                props.getSecretKey()
        );

        this.s3Client = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                .endpointOverride(URI.create(props.getEndpoint()))
                .region(Region.of(props.getRegion()))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build()
                ).build();
    }

    public List<String> listObjectKeys(String prefix) {
        ListObjectsV2Request request = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix(prefix)
                .build();

        ListObjectsV2Response listObjectsV2Response = s3Client.listObjectsV2(request);

        return listObjectsV2Response
                .contents()
                .stream()
                .map(S3Object::key)
                .collect(Collectors.toList());
    }

    /**
     * Downloads a file synchronously.
     * Removed @Async so the caller waits until the file is fully written to disk.
     */
    public GetObjectResponse downloadFileFromR2(String fileName, String localFilePath) {
        GetObjectRequest getReq = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();

        int maxRetries = 3;
        for(int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Path localPath = Paths.get(localFilePath);
                // Ensure parent directories exist
                if (localPath.getParent() != null) {
                    Files.createDirectories(localPath.getParent());
                }

                // This blocks until the file is completely downloaded
                GetObjectResponse outRes = s3Client.getObject(
                        getReq,
                        localPath
                );

                logger.info("File Downloaded to: {}", localFilePath);
                return outRes; // Return the response directly

            } catch (Exception ex) {
                logger.error("Download attempt {} failed for {}: {}", attempt, fileName, ex.getMessage());

                if (attempt == maxRetries) {
                    logger.error("Max retries reached. Download failed for {}", fileName);
                    throw new RuntimeException("Failed to download file: " + fileName, ex);
                }

                try {
                    Thread.sleep(1000L * attempt); // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Download interrupted", ie);
                }
            }
        }
        throw new RuntimeException("Unknown Download failure");
    }
}