package org.godn.uploadservice.upload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UploadRequestDto {

    @NotBlank(message = "Repository URL is mandatory")
    @Pattern(regexp = "^https://github\\.com/.+\\.git$", message = "Must be a valid HTTPS GitHub .git URL")
    private String repoUrl;

    @NotBlank(message = "Project name is mandatory")
    private String projectName;

    @NotBlank(message = "Branch is mandatory")
    @Pattern(regexp = "^[a-zA-Z0-9._/]+$", message = "Branch name contains invalid characters")
    private String branch;

    private Map<String, String> secrets;

}
