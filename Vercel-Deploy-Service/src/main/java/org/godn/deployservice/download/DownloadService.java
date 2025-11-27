package org.godn.deployservice.download;

import org.godn.deployservice.storage.S3DownloadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class DownloadService {
    private static final Logger logger = LoggerFactory.getLogger(DownloadService.class);
    private final S3DownloadService s3DownloadService;

    public DownloadService(S3DownloadService s3DownloadService) {
        this.s3DownloadService = s3DownloadService;
    }

    @Async
    public CompletableFuture<Void> downloadR2Folder(String uploadId, Path destinationPath) {
        logger.info("Starting download for upload ID: {} to destination: {}", uploadId, destinationPath.toAbsolutePath());

        String s3ListPrefix = "output/" + uploadId;
        String s3StripPrefix = s3ListPrefix + "/";

        List<String> fileKeys = s3DownloadService.listObjectKeys(s3ListPrefix);
        List<CompletableFuture<?>> futures = new ArrayList<>();

        if (fileKeys.isEmpty()) {
            logger.warn("⚠️ No files found in R2 for prefix: {}", s3ListPrefix);
        } else {
            logger.info("Found {} files to download in R2: {}", fileKeys.size(), fileKeys);
        }

        for (String key : fileKeys) {
            if (!key.startsWith(s3StripPrefix)) {
                continue;
            }

            String relativePath = key.substring(s3StripPrefix.length());
            if (relativePath.isEmpty()) {
                continue;
            }
            Path finalFilePath = destinationPath.resolve(relativePath);

            CompletableFuture<?> future = CompletableFuture.runAsync(() -> {
                try {
                    Files.createDirectories(finalFilePath.getParent());
                } catch (IOException e) {
                    throw new RuntimeException("Could not create parent directories for: " + finalFilePath, e);
                }
            }).thenCompose(v -> s3DownloadService.downloadFileFromR2(key, finalFilePath.toAbsolutePath().toString())
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            logger.error("Failed to download {}: {}", key, ex.getMessage());
                        } else {
                            logger.info("Downloaded: {} -> {}", key, finalFilePath);
                        }
                    }));
            futures.add(future);
        }
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
    }
}