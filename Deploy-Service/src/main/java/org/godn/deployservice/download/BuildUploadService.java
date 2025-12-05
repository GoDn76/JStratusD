package org.godn.deployservice.download;

import org.godn.deployservice.storage.S3UploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Stream;

@Service
public class BuildUploadService {
    private static final Logger logger = LoggerFactory.getLogger(BuildUploadService.class);

    private final S3UploadService s3UploadService;

    public BuildUploadService(S3UploadService s3UploadService) {
        this.s3UploadService = s3UploadService;
    }

    @Async
    public CompletableFuture<Void> uploadBuildDirectory(Path localDirectory, String s3Prefix) {
        logger.info("Starting directory upload: {} -> s3://.../{}", localDirectory, s3Prefix);
        try (Stream<Path> paths = Files.walk(localDirectory)) {
            List<CompletableFuture<Void>> futures = paths
                    .filter(Files::isRegularFile)
                    .map(localFilePath -> CompletableFuture.runAsync(() -> {
                        try {
                            Path relativePath = localDirectory.relativize(localFilePath);
                            String s3Key = s3Prefix + "/" + relativePath.toString().replace(File.separatorChar, '/');

                            // Call the synchronous/blocking S3 client
                            s3UploadService.uploadFileToR2(s3Key, String.valueOf(localFilePath));

                        } catch (Exception e) {
                            logger.error("Failed to upload file: {}", localFilePath, e);
                            throw new RuntimeException(e);
                        }
                    }))
                    .toList();

            return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                    .whenComplete((res, ex) -> {
                        if (ex == null) {
                            logger.info("Successfully finished directory upload: {}", s3Prefix);
                        } else {
                            logger.error("Directory upload failed", ex);
                        }
                    });

        } catch (IOException e) {
            logger.error("Failed to walk directory: {}", localDirectory, e);
            return CompletableFuture.failedFuture(e);
        }
    }
}