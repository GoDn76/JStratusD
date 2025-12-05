package org.godn.deployservice.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class S3UploadService {
    private static final Logger logger = LoggerFactory.getLogger(S3UploadService.class);
    private final S3Client s3Client;
    private final String bucketName;

    public S3UploadService(
            @Value("${cloud.s3.bucket.bucket-name}") String bucketName,
            @Value("${cloud.s3.bucket.access-key}") String accessKey,
            @Value("${cloud.s3.bucket.secret-key}") String secretKey,
            @Value("${cloud.s3.bucket.endpoint}") String endpoint,
            @Value("${cloud.s3.bucket.region:auto}") String region
    ) {
        this.bucketName = bucketName;
        AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKey, secretKey);
        this.s3Client = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    public PutObjectResponse uploadFileToR2(String s3Key, String localFilePath) {
        Path path = Paths.get(localFilePath);
        PutObjectRequest putReq = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return s3Client.putObject(putReq, RequestBody.fromFile(path));
            } catch (Exception ex) {
                logger.error("Upload attempt {} failed: {}", attempt, ex.getMessage());
                if (attempt == maxRetries) throw new RuntimeException(ex);
                try { Thread.sleep(1000L * attempt); } catch (InterruptedException ignored) {}
            }
        }
        throw new RuntimeException("Upload failed");
    }
    /**
     * Deletes all files starting with the given prefix.
     * Example: deleteFolder("output/0E9L6/")
     */
    public void deleteFolder(String prefix) {
        try {
            // 1. List all objects
            ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();

            ListObjectsV2Response listRes = s3Client.listObjectsV2(listReq);

            if (listRes.hasContents()) {
                // 2. Prepare delete request
                List<ObjectIdentifier> objectsToDelete = listRes.contents().stream()
                        .map(obj -> ObjectIdentifier.builder().key(obj.key()).build())
                        .collect(Collectors.toList());

                DeleteObjectsRequest deleteReq = DeleteObjectsRequest.builder()
                        .bucket(bucketName)
                        .delete(Delete.builder().objects(objectsToDelete).build())
                        .build();

                // 3. Delete
                s3Client.deleteObjects(deleteReq);
                logger.info("Deleted {} files from R2 folder: {}", objectsToDelete.size(), prefix);
            }
        } catch (Exception e) {
            logger.error("Failed to delete R2 folder: {}", prefix, e);
            // Don't throw exception here; we don't want to block the DB delete just because S3 failed.
        }
    }
}