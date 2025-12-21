package org.godn.uploadservice.upload;

import org.godn.uploadservice.deployment.BranchResponseDto;
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
import java.util.List;
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
    @Mock private UploadService selfProxy;
    @InjectMocks private UploadService uploadService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(uploadService, "self", selfProxy);
        ReflectionTestUtils.setField(uploadService, "s3BaseFolder", "test-folder"); // Inject @Value field
    }

    @Test
    void uploadProject_ShouldReturnExistingId_IfActive() {
        String userId = "user-1";
        String repo = "https://github.com/test/repo";
        UploadRequestDto req = new UploadRequestDto();
        req.setRepoUrl(repo);

        // FIX 1: Use matching ID
        DeploymentResponseDto activeDto = new DeploymentResponseDto(
                "EXISTING_ID", "Name", "Hash", "READY", repo, "main", "url", LocalDateTime.now()
        );
        when(deploymentService.findActiveDeployment(repo, userId)).thenReturn(Optional.of(activeDto));

        String resultId = uploadService.uploadProject(req, userId);

        assertEquals("EXISTING_ID", resultId);

        // Correct verifications
        verify(deploymentService, never()).saveDeployment(any());
        // Match Argument types strictly or use any()
        verify(selfProxy, never()).processRepoInBackground(any(), any(), any(), any());
    }

    @Test
    void uploadProject_ShouldStartNew_IfNoneActive() {
        String userId = "user-1";
        String repo = "https://github.com/test/repo";
        String branch = "main";

        UploadRequestDto req = new UploadRequestDto();
        req.setRepoUrl(repo);
        req.setBranch(branch); // Ensure request has branch!
        req.setProjectName("My Project");

        when(deploymentService.findActiveDeployment(repo, userId)).thenReturn(Optional.empty());
        when(deploymentService.exitsById(anyString())).thenReturn(false); // ID is unique

        // FIX 3: Mock the Branch fetch
        BranchResponseDto b = new BranchResponseDto();
        b.setName("main");
        BranchResponseDto.CommitInfo c = new BranchResponseDto.CommitInfo();
        c.setSha("sha-123");
        b.setCommit(c);

        when(deploymentService.getBranches(eq(repo), any())).thenReturn(List.of(b));

        // Execute
        String resultId = uploadService.uploadProject(req, userId);

        assertNotNull(resultId);
        assertEquals(5, resultId.length());

        verify(deploymentService).checkDeploymentLimit(userId);
        verify(deploymentService).saveDeployment(any(Deployment.class));

        // FIX 2: Verify EXACT argument order (check your Service class!)
        // Assuming: processRepoInBackground(id, url, userId, branch)
        verify(selfProxy).processRepoInBackground(eq(resultId), eq(repo), eq(userId), eq(branch));
    }
}