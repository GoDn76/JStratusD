package org.godn.deployservice.build;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.godn.deployservice.log.BuildLog;
import org.godn.deployservice.log.BuildLogRepository;
import org.godn.deployservice.download.BuildUploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class BuildService {
    private static final Logger logger = LoggerFactory.getLogger(BuildService.class);

    private static final int DB_BATCH_SIZE = 100; // Save 100 lines at a time

    private final BuildUploadService buildUploadService;
    private final BuildLogRepository buildLogRepository;

    public BuildService(BuildUploadService buildUploadService, BuildLogRepository buildLogRepository) {
        this.buildUploadService = buildUploadService;
        this.buildLogRepository = buildLogRepository;
    }

    public void buildReactApp(Path projectDir, String deploymentId, Map<String, String> environmentVariables) throws Exception {
        logger.info("Starting Build for deployment: {}", deploymentId);

        Path buildDir = getStaticBuildDirectory(projectDir);
        logger.info("Detected static build output directory: {}", buildDir.getFileName());

        // Run the build with the non-blocking logger
        runLocalNpmBuild(projectDir, deploymentId, environmentVariables);

        if (!Files.exists(buildDir)) {
            throw new RuntimeException("Build folder not found after Build: " + buildDir.toAbsolutePath());
        }
        logger.info("✅ Build completed successfully.");

        try {
            String destinationPrefix = "live-sites/" + deploymentId;
            logger.info("Uploading artifacts to R2: {}", destinationPrefix);
            buildUploadService.uploadBuildDirectory(buildDir, destinationPrefix).join();
            logger.info("🚀 Successfully deployed site!");
        } catch (Exception e) {
            logger.error("Failed to upload build artifacts to R2", e);
            throw new RuntimeException("Build succeeded but upload failed", e);
        }
    }

    private void runLocalNpmBuild(Path projectDir, String deploymentId, Map<String, String> envVars) throws IOException, InterruptedException {
        Process process = getBuildProcess(projectDir, envVars);

        // --- ASYNC LOGGING SETUP ---
        // A thread-safe queue to hold logs in memory temporarily
        BlockingQueue<BuildLog> logQueue = new LinkedBlockingQueue<>();
        AtomicBoolean isProcessRunning = new AtomicBoolean(true);

        // Start a background thread to drain the queue and save to DB
        CompletableFuture<Void> logSaverTask = CompletableFuture.runAsync(() -> {
            processLogQueue(logQueue, isProcessRunning);
        });

        // --- MAIN THREAD: READ FAST ---
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                // 1. Log to console immediately
                logger.info("[npm-build] {}", line);

                // 2. Add to Queue (Instant operation)
                // This ensures we never block the npm process
                logQueue.offer(BuildLog.builder()
                        .deploymentId(deploymentId)
                        .content(line)
                        .timestamp(LocalDateTime.now())
                        .build());
            }
        } catch (Exception e) {
            logger.error("Error reading build logs", e);
        } finally {
            // Signal the background thread to stop after emptying the queue
            isProcessRunning.set(false);
        }

        // Wait for the process to finish
        int exitCode = process.waitFor();

        // Wait for the log saver to finish writing the remaining logs to DB
        try {
            logSaverTask.join();
        } catch (Exception e) {
            logger.warn("Log saver thread encountered an issue", e);
        }

        if (exitCode != 0) {
            throw new RuntimeException("Local npm build failed with exit code " + exitCode);
        }
    }

    /**
     * Background task that batches DB writes.
     */
    private void processLogQueue(BlockingQueue<BuildLog> queue, AtomicBoolean isRunning) {
        List<BuildLog> batch = new ArrayList<>(DB_BATCH_SIZE);

        // Keep running while the process is alive OR there are still logs in the queue
        while (isRunning.get() || !queue.isEmpty()) {
            try {
                // Poll with a small timeout to prevent tight CPU loops when empty
                BuildLog log = queue.poll(100, TimeUnit.MILLISECONDS);

                if (log != null) {
                    batch.add(log);
                }

                // Flush if batch is full OR if process finished and we have leftovers
                if (batch.size() >= DB_BATCH_SIZE || (log == null && !batch.isEmpty())) {
                    buildLogRepository.saveAll(batch);
                    batch.clear();
                }
            } catch (Exception e) {
                logger.error("Failed to save log batch", e);
                // Don't crash the thread, just clear buffer and try to continue
                batch.clear();
            }
        }
    }

    // ... (getStaticBuildDirectory, getBuildProcess, deleteDirectory methods remain UNCHANGED) ...
    // Paste the rest of the existing methods here...

    private static Process getBuildProcess(Path projectDir, Map<String, String> environmentVariables) throws IOException {

        // 1. Check if package-lock.json exists
        boolean hasLockFile = Files.exists(projectDir.resolve("package-lock.json"));

        String installCommand;

        if (hasLockFile) {
            // Use 'npm ci' for clean, faster installs
            logger.info("Detected package-lock.json. Using 'npm ci' for faster, reliable build.");
            installCommand = "npm ci --legacy-peer-deps --no-audit --no-fund";
        } else {
            // ⚠️ FALLBACK: Use 'npm install'
            logger.warn("No package-lock.json found. Falling back to 'npm install'.");
            installCommand = "npm install --legacy-peer-deps --no-progress --no-audit --no-fund";
        }

        // 2. Construct the full command chain
        String command = installCommand + " && npm run build";

        ProcessBuilder processBuilder = new ProcessBuilder("sh", "-c", command);
        processBuilder.directory(projectDir.toFile());

        // Redirect stderr to stdout so we capture errors in the logs
        processBuilder.redirectErrorStream(true);

        // Inject Secrets
        Map<String, String> processEnv = processBuilder.environment();
        if (environmentVariables != null && !environmentVariables.isEmpty()) {
            processEnv.putAll(environmentVariables);
        }

        return processBuilder.start();
    }

    private Path getStaticBuildDirectory(Path projectDir) throws IOException {
        // ... (Use your existing code here) ...
        Path packageJsonPath = projectDir.resolve("package.json");
        if (!Files.exists(packageJsonPath)) {
            throw new RuntimeException("package.json not found in project directory.");
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(packageJsonPath.toFile());
        String buildScript = root.path("scripts").path("build").asText();

        if (buildScript.contains("next build")) {
            boolean isStaticExport = false;
            Path nextConfigJs = projectDir.resolve("next.config.js");
            Path nextConfigMjs = projectDir.resolve("next.config.mjs");
            try {
                String configContent = "";
                if (Files.exists(nextConfigJs)) {
                    configContent = Files.readString(nextConfigJs);
                } else if (Files.exists(nextConfigMjs)) {
                    configContent = Files.readString(nextConfigMjs);
                }
                if (configContent.contains("output") && configContent.contains("export")) {
                    isStaticExport = true;
                }
            } catch (IOException e) {
                logger.warn("Could not read next.config.js: {}", e.getMessage());
            }
            if (isStaticExport) {
                return projectDir.resolve("out");
            } else {
                throw new RuntimeException("Unsupported Build Type: This service only deploys static sites. Please add 'output: \"export\"' to your next.config.js.");
            }
        } else if (buildScript.contains("vite build")) {
            return projectDir.resolve("dist");
        } else if (buildScript.contains("react-scripts build")) {
            return projectDir.resolve("build");
        } else {
            logger.warn("Could not determine build type. Falling back to 'build' folder.");
            return projectDir.resolve("build");
        }
    }

    public void deleteDirectory(File dir) throws IOException {
        if (dir != null && dir.exists()) {
            Files.walk(dir.toPath())
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        }
    }
}