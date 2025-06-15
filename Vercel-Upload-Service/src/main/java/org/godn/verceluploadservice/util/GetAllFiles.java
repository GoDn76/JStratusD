package org.godn.verceluploadservice.util;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class GetAllFiles {
    public static String[] getAllFiles(String path) {
        List<String> filePaths = new ArrayList<>();
        collectFiles(new File(path), filePaths);
        return filePaths.toArray(new String[0]);
    }

    private static void collectFiles(File folder, List<String> filePaths) {
        if (folder.exists() && folder.isDirectory()) {
            for (File file : Objects.requireNonNull(folder.listFiles())) {
                if (file.isFile()) {
                    filePaths.add(file.getAbsolutePath());
                } else if (file.isDirectory()) {
                    collectFiles(file, filePaths);
                }
            }
        }
    }
    public static void main(String[] args) {
        String dir = "JzBlN";
        String currentDir = System.getProperty("user.dir");
        Path targetPath = Paths.get(currentDir, "output", dir);
        System.out.println(targetPath);
    }
}
