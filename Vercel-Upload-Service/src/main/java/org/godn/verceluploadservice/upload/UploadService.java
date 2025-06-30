package org.godn.verceluploadservice.upload;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.godn.verceluploadservice.queue.RedisQueueService;
import org.godn.verceluploadservice.storage.S3UploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.godn.verceluploadservice.util.*;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

@Service
public class UploadService {
    private static final Logger logger = LoggerFactory.getLogger(UploadService.class);
    private final S3UploadService s3UploadService;
    private final RedisQueueService redisQueueService;

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


        String uploadId = GenerateId.create();
        String msg;


        String currentDir = System.getProperty("user.dir");
        Path targetPath = Paths.get(currentDir, outputDir);

        File targetDir = new File(targetPath.toString(), uploadId);


        if (!targetDir.getAbsolutePath().startsWith(new File(outputDir).getAbsolutePath())) {
            msg = "Invalid upload ID or output directory";
            logger.error(msg);
            return CompletableFuture.completedFuture(new UploadResponseDto(false, msg, null));
        }

        if (!targetDir.exists() && !targetDir.mkdirs()) {
            msg = "Failed to create output directory";
            logger.error(msg);
            return CompletableFuture.completedFuture(new UploadResponseDto(false, msg, null));
        }

        try{
            Git.cloneRepository()
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



        }catch(GitAPIException e){
            msg = "Failed to upload repository: " + e.getMessage();
            logger.error(msg, e);
            return CompletableFuture.completedFuture(new UploadResponseDto(false, msg, null));
        }

        return CompletableFuture.completedFuture(new UploadResponseDto(true, msg, uploadId));
    }


}
