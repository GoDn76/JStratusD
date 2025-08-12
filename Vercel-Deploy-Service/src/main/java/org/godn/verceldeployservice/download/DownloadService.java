package org.godn.verceldeployservice.download;


import org.godn.verceldeployservice.storage.S3DownloadService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;
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
    public CompletableFuture<Void> downloadR2Folder(String uploadId) {
        logger.info("Starting download for upload ID: {}", uploadId);

        Path baseDir = Paths.get(System.getProperty("user.dir"));

        logger.info("Downloading Files to : {}", baseDir);

        List<CompletableFuture<?>> futures = new ArrayList<>();
        List<String> fileNames = s3DownloadService.listObjectKeys("output/"+uploadId);
        for(String key: fileNames) {
            logger.info("Found {} files to download: {}", fileNames.size(), fileNames);
            Path filePath = baseDir.resolve(key);
            CompletableFuture<?> future = s3DownloadService.downloadFileFromR2(key, filePath.toAbsolutePath().toString())
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            logger.error("Failed to download {}: {}", key, ex.getMessage(), ex);
                        } else {
                            logger.info("Downloaded: {}", key);
                        }
                    });
            futures.add(future);
        }
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
    }
}
