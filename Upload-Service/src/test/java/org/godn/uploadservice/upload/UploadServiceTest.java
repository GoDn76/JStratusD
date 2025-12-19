package org.godn.uploadservice.upload;

import org.godn.uploadservice.deployment.Deployment;
import org.godn.uploadservice.deployment.DeploymentResponseDto;
import org.godn.uploadservice.deployment.DeploymentService;
import org.godn.uploadservice.queue.RedisQueueService;
import org.godn.uploadservice.storage.S3UploadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UploadServiceTest {

    @Mock private S3UploadService s3UploadService;
    @Mock private RedisQueueService redisQueueService;
    @Mock private DeploymentService deploymentService;

    @Mock
    private UploadService selfProxy; // Mocking the self-injected proxy

    @InjectMocks
    private UploadService uploadService;

    @BeforeEach
    void setUp() {
        // Manually inject the 'self' mock into the service
        ReflectionTestUtils.setField(uploadService, "self", selfProxy);
    }

    @Test
    void uploadProject_ShouldReturnExistingId_IfActive() {
        String userId = "user-1";
        String repo = "https://github.com/test/repo";
        UploadRequestDto req = new UploadRequestDto();
        req.setRepoUrl(repo);

        // Mock that an active deployment exists
        DeploymentResponseDto activeDto = new DeploymentResponseDto("id", "READY", "https://repo.git", "https://site.url", LocalDateTime.now());
        when(deploymentService.findActiveDeployment(repo, userId)).thenReturn(Optional.of(activeDto));

        // Execute
        String resultId = uploadService.uploadProject(req, userId);

        // Verify
        assertEquals("OLD_ID", resultId);

        // Ensure we did NOT save a new one or start async process
        verify(deploymentService, never()).saveDeployment(any());
        verify(selfProxy, never()).processRepoInBackground(anyString(), anyString());
    }

    @Test
    void uploadProject_ShouldStartNew_IfNoneActive() {
        String userId = "user-1";
        String repo = "https://github.com/test/repo";
        UploadRequestDto req = new UploadRequestDto();
        req.setRepoUrl(repo);

        // Mock no active deployment
        when(deploymentService.findActiveDeployment(repo, userId)).thenReturn(Optional.empty());

        // Execute
        String resultId = uploadService.uploadProject(req, userId);

        // Verify
        assertNotNull(resultId);
        assertEquals(5, resultId.length());

        // Verify Flow
        verify(deploymentService).checkDeploymentLimit(userId);
        verify(deploymentService).saveDeployment(any(Deployment.class));

        // Verify the Async method was called on the proxy
        verify(selfProxy).processRepoInBackground(eq(resultId), eq(repo));
    }
}