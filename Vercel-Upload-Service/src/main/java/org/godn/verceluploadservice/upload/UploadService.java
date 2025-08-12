package org.godn.verceluploadservice.upload;


import org.eclipse.jgit.api.Git;
import org.godn.verceluploadservice.queue.RedisQueueService;
import org.godn.verceluploadservice.storage.S3UploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.godn.verceluploadservice.util.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Stream;
import java.util.Comparator;

@Service
public class UploadService {
    private static final Logger logger = LoggerFactory.getLogger(UploadService.class);
    private final S3UploadService s3UploadService;
    private final RedisQueueService redisQueueService;
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long MAX_DIRECTORY_SIZE = 1024 * 1024 * 1024; // 1GB limit


    public UploadService(S3UploadService s3UploadService, RedisQueueService redisQueueService) {
        this.s3UploadService = s3UploadService;
        this.redisQueueService = redisQueueService;
    }


    @Value("${upload.output.dir:output}")
    private String outputDir;

    @Async
    public CompletableFuture<UploadResponseDto> uploadRepo(UploadRequestDto uploadRequestDto) {
        String repoUrl = uploadRequestDto.getRepoUrl();
        logger.info("Uploading repository URL: {}", repoUrl);
        Git git = null;
        String msg;
        Path tempDir = null;

        String uploadId = GenerateId.create();

        try{
            tempDir = Files.createTempDirectory("upload-service-"+uploadId+"-");
            File targetDir = tempDir.toFile();


            git = Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(targetDir)
                .call();

            msg = "Repository uploaded successfully with ID: " + uploadId;
            logger.info(msg);
            logger.info("Files in the repository: {}", targetDir);
            String[] files = GetAllFiles.getAllFiles(targetDir.toString());
            logger.info("{}\n{}", files.length, Arrays.toString(files));

            List<CompletableFuture<Void>> uploadFutures = Arrays.stream(files)
                    .map(file -> {
                        String relativePath = targetDir.toPath().relativize(new File(file).toPath()).toString().replace(File.separatorChar, '/');
                        // Skip .git files and folders
                        if (relativePath.startsWith(".git/") || relativePath.equals(".git")) {
                            return null;
                        }
                        String uploadPath = outputDir+"/" + uploadId + "/" + relativePath;
                        return s3UploadService.uploadFileToR2(uploadPath, file)
                                .thenAccept(response -> {
                                    if (response.sdkHttpResponse().isSuccessful()) {
                                        logger.info("File '{}' uploaded successfully to R2", file);
                                    } else {
                                        logger.error("Failed to upload file '{}' to R2: {}", file, response.sdkHttpResponse().statusText().orElse("Unknown error"));
                                    }
                                })
                                .exceptionally(e -> {
                                    logger.error("Error during file upload to R2 for '{}'", file, e);
                                    return null;
                                });
                    }).filter(Objects::nonNull)
                    .toList();

            CompletableFuture<Void> allUploads = CompletableFuture.allOf(uploadFutures.toArray(new CompletableFuture[0]));
            allUploads.join();

            logger.info("All files uploaded successfully to R2 for upload ID: {}", uploadId);

            // Add upload ID to Redis queue
            redisQueueService.pushToQueue(uploadId);
            logger.info("Upload ID '{}' added to Redis queue", uploadId);

        } catch(Exception e){
            msg = "Failed to upload repository: " + e.getMessage();
            logger.error(msg, e);
            return CompletableFuture.completedFuture(new UploadResponseDto(false, msg, null));
        } finally {
            if (git != null) git.close(); // Close Git instance
            // Force garbage collection to release file handles
            System.gc();

            if(tempDir != null) {
                cleanupDirectory(tempDir);
            }
        }

        return CompletableFuture.completedFuture(new UploadResponseDto(true, msg, uploadId));
    }

    private long getDirectorySize(Path directory) throws IOException {
        try (Stream<Path> walk = Files.walk(directory)) {
            return walk.filter(Files::isRegularFile)
                    .mapToLong(p -> {
                        try {
                            return Files.size(p);
                        } catch (IOException e) {
                            logger.error("Error getting file size: {}", p, e);
                            return 0L;
                        }
                    })
                    .sum();
        }
    }

    private void cleanupDirectory(Path dirPath) {

        // Check directory size
        try {
            long dirSize = getDirectorySize(dirPath);
            if (dirSize > MAX_DIRECTORY_SIZE) {
                logger.warn("Directory size {} exceeds limit of {}. Proceeding with deletion.",
                        dirSize, MAX_DIRECTORY_SIZE);
            }
        } catch (IOException e) {
            logger.error("Failed to calculate directory size: {}", dirPath, e);
        }

        // Attempt deletion with retries
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            if (Files.exists(dirPath)) {
                // Log files before deletion
                logger.debug("Starting deletion of directory: {}", dirPath);
                try {
                    Files.walk(dirPath)
                            .sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                    logger.info("Cleaned up temp directory: {}", dirPath);
                } catch (IOException e) {
                    logger.error("Attempt {} failed to delete directory: {}", attempt, dirPath, e);
                    if (attempt == MAX_RETRY_ATTEMPTS) {
                        logger.error("Failed all attempts to delete directory. Manual cleanup required: {}", dirPath);
                    } else {
                        try {
                            Thread.sleep(1000);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
                // Verify deletion
                if (!Files.exists(dirPath)) {
                    logger.info("Successfully deleted directory: {}", dirPath);
                    return;
                } else {
                    logger.warn("Directory still exists after deletion attempt: {}", dirPath);
                }
            } else {
                logger.info("Directory already doesn't exist: {}", dirPath);
                return;
            }
        }
    }
}
