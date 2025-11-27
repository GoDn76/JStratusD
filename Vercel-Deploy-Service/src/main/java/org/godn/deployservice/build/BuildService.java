package org.godn.deployservice.build;

import org.godn.deployservice.download.UploadService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

@Service
public class BuildService {
    private static final Logger logger = LoggerFactory.getLogger(BuildService.class);

    private final UploadService uploadService;

    public BuildService(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    /**
     * Orchestrates the build and upload process for STATIC projects only.
     */
    public void buildReactApp(Path projectDir) throws Exception {
        logger.info("Starting Build in directory: {}", projectDir.toAbsolutePath());

        // Step 1: Detect the static build directory.
        // This method now also validates *against* server builds.
        Path buildDir = getStaticBuildDirectory(projectDir);
        logger.info("Detected static build output directory: {}", buildDir.getFileName());

        // Step 2: Run the local build process.
        runLocalNpmBuild(projectDir);

        // Step 3: Verify the build output exists.
        if (!Files.exists(buildDir)) {
            throw new RuntimeException("Build folder not found after Build: " + buildDir.toAbsolutePath());
        }
        logger.info("✅ Build completed successfully for project: {}", projectDir.getFileName());

        // Step 4: Upload the static build artifacts.
        try {
            String projectId = projectDir.getFileName().toString().split("-")[1];
            String destinationPrefix = "live-sites/" + projectId;

            logger.info("Calling BuildUploadService to upload artifacts to {}", destinationPrefix);
            uploadService.uploadBuildDirectory(buildDir, destinationPrefix).join();

            logger.info("🚀 Successfully deployed site!");
            logger.info("==================================================================================");

        } catch (Exception e) {
            logger.error("Failed to upload build artifacts to R2", e);
            throw new RuntimeException("Build succeeded but upload failed", e);
        }
    }

    /**
     * Reads package.json to determine the correct STATIC build output directory.
     * Throws an error if it detects a Next.js server build.
     */
    private Path getStaticBuildDirectory(Path projectDir) throws IOException {
        Path packageJsonPath = projectDir.resolve("package.json");
        if (!Files.exists(packageJsonPath)) {
            throw new RuntimeException("package.json not found in project directory.");
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(packageJsonPath.toFile());
        String buildScript = root.path("scripts").path("build").asText();

        // --- Static Build Detection Logic ---

        if (buildScript.contains("next build")) {
            // It's a Next.js project. We MUST find 'output: "export"'.
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
                logger.info("Detected Next.js static export. Using 'out' directory.");
                return projectDir.resolve("out"); // The static export folder
            } else {
                // Not a static export. This is an unsupported server build.
                logger.error("Build failed: Project is a Next.js server build, which is not supported.");
                throw new RuntimeException("Unsupported Build Type: This service only deploys static sites. " +
                        "To deploy this Next.js project, please add 'output: \"export\"' to your next.config.js file.");
            }

        } else if (buildScript.contains("vite build")) {
            return projectDir.resolve("dist");
        } else if (buildScript.contains("react-scripts build")) {
            return projectDir.resolve("build");
        } else {
            // Default fallback for other potential static generators
            logger.warn("Could not determine build type from script: '{}'. Falling back to 'build' folder.", buildScript);
            return projectDir.resolve("build");
        }
    }

    /**
     * Executes the dynamic nvm-based build command.
     */
    private void runLocalNpmBuild(Path projectDir) throws IOException, InterruptedException {
        Process process = getBuildProcess(projectDir);
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.info("[npm-build] {}", line);
            }
        }
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Local npm build failed with exit code " + exitCode);
        }
    }

    /**
     * Creates the build process with the nvm command.
     */
    private static Process getBuildProcess(Path projectDir) throws IOException {
        // This command installs the latest node version.
        // You could also change "nvm install node" to "nvm install --lts"
        // to install the latest stable version, which is often safer.
        String command = "export NVM_DIR=\"/root/.nvm\" && " +
                "[ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\" && " +
                "echo 'Installing latest LTS Node.js version...' && " +
                "nvm install --lts && " +  // Changed from "node" to "--lts"
                "nvm use --lts && " +      // Changed from "node" to "--lts"
                "npm install --legacy-peer-deps && " +
                "npm run build";

        ProcessBuilder processBuilder = new ProcessBuilder("sh", "-c", command);
        processBuilder.directory(projectDir.toFile());
        processBuilder.redirectErrorStream(true);
        return processBuilder.start();
    }

    /**
     * Recursively deletes a directory.
     */
    public void deleteDirectory(File dir) throws IOException {
        if (dir != null && dir.exists()) {
            Files.walk(dir.toPath())
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        }
    }
}