package org.godn.verceldeployservice.download;

import org.godn.verceldeployservice.storage.S3UploadService; // Import the "dumb" client
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Stream;

@Service
public class UploadService {
    private static final Logger logger = LoggerFactory.getLogger(UploadService.class);

    private final S3UploadService s3UploadService; // Inject the "dumb" client

    public UploadService(S3UploadService s3UploadService) {
        this.s3UploadService = s3UploadService;
    }
    // The bucketName field has been REMOVED. This service doesn't need it.

    /**
     * This is the "smart" method containing all your business logic.
     * It walks a directory and uses the S3UploadService to upload each file in parallel.
     */
    @Async
    public CompletableFuture<Void> uploadBuildDirectory(Path localDirectory, String s3Prefix) {
        // The logger no longer needs the bucketName.
        logger.info("Starting directory upload: {} -> s3://{}/{}", localDirectory, s3Prefix);

        try (Stream<Path> paths = Files.walk(localDirectory)) {
            List<CompletableFuture<Void>> futures = paths
                    .filter(Files::isRegularFile)
                    .map(localFilePath -> CompletableFuture.runAsync(() -> {
                        try {
                            Path relativePath = localDirectory.relativize(localFilePath);
                            String s3Key = s3Prefix + "/" + relativePath.toString().replace("\\", "/");

                            // Use the injected client to do the raw upload
                            // The s3UploadService already knows its own bucket.
                            s3UploadService.uploadFile(s3Key, localFilePath);

                        } catch (Exception e) {
                            logger.error("Failed to upload file: {}", localFilePath, e);
                        }
                    }))
                    .toList();

            return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                    .whenComplete((res, ex) -> {
                        if (ex == null) {
                            logger.info("Successfully finished directory upload: s3://{}", s3Prefix);
                        } else {
                            logger.error("Directory upload failed with an exception", ex);
                        }
                    });

        } catch (IOException e) {
            logger.error("Failed to walk directory: {}", localDirectory, e);
            return CompletableFuture.failedFuture(e);
        }
    }
}