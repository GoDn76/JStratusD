package org.godn.verceldeployservice.build;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;

@Service
public class BuildService {
    private static final Logger logger = LoggerFactory.getLogger(BuildService.class);

    public void buildReactApp(String projectId, String projectDirPath) throws Exception {
        File projectDir = new File(projectDirPath);

        logger.info("Installing dependencies in {}", projectDirPath);
        runCommand(new String[]{"npm", "install"}, projectDir);

        logger.info("Building React app in {}", projectDirPath);
        runCommand(new String[]{"npm", "run", "build"}, projectDir);

        // Move/copy build folder to {id}-build
        Path buildDir = projectDir.toPath().resolve("build");
        Path targetDir = projectDir.getParentFile().toPath().resolve(projectId + "-build");

        logger.info("Copying build files to {}", targetDir);
        copyDirectory(buildDir, targetDir);

        logger.info("Build files saved to {}", targetDir);
    }

    private void runCommand(String[] command, File workingDir) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.directory(workingDir);
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.info(line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException(String.format("Command `%s` failed with exit code %d", String.join(" ", command), exitCode));
        }
    }

    private void copyDirectory(Path source, Path target) throws IOException {
        if (Files.exists(target)) {
            // Clean up target if it exists
            Files.walk(target)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        }
        Files.walk(source).forEach(path -> {
            try {
                Path dest = target.resolve(source.relativize(path));
                if (Files.isDirectory(path)) {
                    Files.createDirectories(dest);
                } else {
                    Files.copy(path, dest, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        });
    }
}
