package org.godn.uploadservice.deployment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true) // Ignore fields we don't need
public class BranchResponseDto {
    private String name;
    private CommitInfo commit;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CommitInfo {
        private String sha;
        private String url;
    }
}