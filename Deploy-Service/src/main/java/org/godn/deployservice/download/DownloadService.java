package org.godn.deployservice.download;

import org.godn.deployservice.storage.S3DownloadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${upload.output.dir:output}")
    private String baseFolder;

    public DownloadService(S3DownloadService s3DownloadService) {
        this.s3DownloadService = s3DownloadService;
    }

    @Async
    public CompletableFuture<Void> downloadR2Folder(String uploadId, Path destinationPath) {
        logger.info("Starting download for upload ID: {} to destination: {}", uploadId, destinationPath.toAbsolutePath());

        String s3ListPrefix = baseFolder + "/" + uploadId;
        String s3StripPrefix = s3ListPrefix + "/";

        List<String> fileKeys = s3DownloadService.listObjectKeys(s3ListPrefix);
        List<CompletableFuture<?>> futures = new ArrayList<>();

        if (fileKeys.isEmpty()) {
            logger.warn("⚠️ No files found in R2 for prefix: {}", s3ListPrefix);
        } else {
            logger.info("Found {} files to download.", fileKeys.size());
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

            // --- THE FIX IS HERE ---
            // We put EVERYTHING inside one runAsync block.
            // This thread will create the directory AND wait for the S3 download.
            CompletableFuture<?> future = CompletableFuture.runAsync(() -> {
                try {
                    // 1. Create directory
                    Files.createDirectories(finalFilePath.getParent());

                    // 2. Download File (Synchronously)
                    // This line BLOCKS this background thread until the file is on disk.
                    s3DownloadService.downloadFileFromR2(key, finalFilePath.toString());

                    // logger.debug("Downloaded: {}", key); // Optional logging
                } catch (Exception e) {
                    logger.error("Failed to download {}: {}", key, e.getMessage());
                    // Re-throw to ensure the Future is marked as failed
                    throw new RuntimeException(e);
                }
            });

            futures.add(future);
        }

        // Wait for all download threads to finish
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
    }
}