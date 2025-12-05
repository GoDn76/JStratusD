package org.godn.uploadservice.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;

import java.net.URI;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

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

    /**
     * Deletes all files with the given prefix (effectively deleting a "folder").
     * Used for cleaning up source codes and live sites when a project is deleted.
     */
    public void deleteFolder(String prefix) {
        try {
            // 1. List all objects with the prefix
            ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();

            ListObjectsV2Response listRes;
            do {
                listRes = s3Client.listObjectsV2(listReq);
                List<S3Object> s3Objects = listRes.contents();

                if (!s3Objects.isEmpty()) {
                    // 2. Convert to ObjectIdentifiers
                    List<ObjectIdentifier> toDelete = s3Objects.stream()
                            .map(obj -> ObjectIdentifier.builder().key(obj.key()).build())
                            .collect(Collectors.toList());

                    // 3. Delete them in a batch
                    DeleteObjectsRequest deleteReq = DeleteObjectsRequest.builder()
                            .bucket(bucketName)
                            .delete(Delete.builder().objects(toDelete).build())
                            .build();

                    s3Client.deleteObjects(deleteReq);
                    logger.info("Deleted {} files from folder: {}", toDelete.size(), prefix);
                }

                // If there are more files (pagination), create a request for the next page
                listReq = listReq.toBuilder().continuationToken(listRes.nextContinuationToken()).build();

            } while (listRes.isTruncated()); // Continue until all files are listed & deleted

        } catch (Exception e) {
            logger.error("Failed to delete folder: {}", prefix, e);
            // We log but don't throw exception, because DB deletion should proceed
            // even if S3 cleanup fails (it's just orphan data).
        }
    }
}
