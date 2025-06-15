package org.godn.verceluploadservice.upload;

public class UploadDto {
    private String repoUrl;

    public UploadDto() {
    }

    public UploadDto(String repoUrl) {
        this.repoUrl = repoUrl;
    }

    public String getRepoUrl() {
        return repoUrl;
    }

    public void setRepoUrl(String repoUrl) {
        this.repoUrl = repoUrl;
    }

}
