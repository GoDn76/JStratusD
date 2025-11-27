package org.godn.uploadservice.upload;
import org.hibernate.validator.constraints.URL;

public class UploadRequestDto {

//    @NotEmpty(message = "Repository URL cannot be empty")
    @URL(message = "Invalid URL format")
    private String repoUrl;

    public UploadRequestDto() {
    }

    public UploadRequestDto(String repoUrl) {
        this.repoUrl = repoUrl;
    }

    public String getRepoUrl() {
        return repoUrl;
    }

    public void setRepoUrl(String repoUrl) {
        this.repoUrl = repoUrl;
    }

}
