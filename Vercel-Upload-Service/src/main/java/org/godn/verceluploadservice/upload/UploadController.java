package org.godn.verceluploadservice.upload;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.CompletableFuture;

@RestController
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/deploy")
    public CompletableFuture<UploadResponseDto> uploadRepo(
            @Valid @RequestBody UploadRequestDto uploadRequestDto
    )
    {
        return uploadService.uploadRepo(uploadRequestDto);
    }
}
