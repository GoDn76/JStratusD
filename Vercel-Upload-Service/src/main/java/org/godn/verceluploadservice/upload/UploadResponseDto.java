package org.godn.verceluploadservice.upload;

public class UploadResponseDto {
    private boolean success;
    private String message;
    private String uploadId;

    public UploadResponseDto() {

    }

    public UploadResponseDto(boolean success, String message, String uploadId) {
        this.success = success;
        this.message = message;
        this.uploadId = uploadId;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getUploadId() {
        return uploadId;
    }

    public void setUploadId(String uploadId) {
        this.uploadId = uploadId;
    }
}
