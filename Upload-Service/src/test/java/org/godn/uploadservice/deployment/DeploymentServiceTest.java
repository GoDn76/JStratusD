package org.godn.uploadservice.deployment;

import org.godn.uploadservice.exception.BadRequestException;
import org.godn.uploadservice.exception.ResourceNotFoundException;
import org.godn.uploadservice.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeploymentServiceTest {

    @Mock
    private DeploymentRepository deploymentRepository;

    @InjectMocks
    private DeploymentService deploymentService;

    // --- TEST: GET DEPLOYMENT ---

    @Test
    void getDeployment_ShouldReturnDeployment_WhenExists() {
        String id = "12345";
        Deployment mockDeployment = new Deployment();
        mockDeployment.setId(id);

        when(deploymentRepository.findById(id)).thenReturn(Optional.of(mockDeployment));

        Deployment result = deploymentService.getDeployment(id);
        assertEquals(id, result.getId());
    }

    @Test
    void getDeployment_ShouldThrow_WhenNotFound() {
        String id = "invalid";
        when(deploymentRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> deploymentService.getDeployment(id));
    }

    // --- TEST: CHECK LIMITS ---

    @Test
    void checkLimit_ShouldThrow_WhenLimitReached() {
        String userId = "user-1";
        // Mock returning 1 active deployment (Limit is 1)
        when(deploymentRepository.findAllByOwnerIdAndStatusIn(eq(userId), anyList()))
                .thenReturn(List.of(new Deployment()));

        assertThrows(BadRequestException.class, () -> deploymentService.checkDeploymentLimit(userId));
    }

    @Test
    void checkLimit_ShouldPass_WhenNoActiveDeployments() {
        String userId = "user-1";
        when(deploymentRepository.findAllByOwnerIdAndStatusIn(eq(userId), anyList()))
                .thenReturn(List.of()); // Empty list

        assertDoesNotThrow(() -> deploymentService.checkDeploymentLimit(userId));
    }

    // --- TEST: CANCEL DEPLOYMENT ---

    @Test
    void cancelDeployment_ShouldSuccess_WhenOwnerAndQueued() {
        String userId = "owner-1";
        String deployId = "dep-1";

        Deployment d = new Deployment();
        d.setId(deployId);
        d.setOwnerId(userId);
        d.setStatus(DeploymentStatus.QUEUED);

        when(deploymentRepository.findById(deployId)).thenReturn(Optional.of(d));

        deploymentService.cancelDeployment(userId, deployId);

        assertEquals(DeploymentStatus.CANCELLED, d.getStatus());
        verify(deploymentRepository).save(d);
    }

    @Test
    void cancelDeployment_ShouldThrow_WhenNotOwner() {
        String userId = "hacker";
        String deployId = "dep-1";

        Deployment d = new Deployment();
        d.setId(deployId);
        d.setOwnerId("real-owner");

        when(deploymentRepository.findById(deployId)).thenReturn(Optional.of(d));

        assertThrows(UnauthorizedException.class, () -> deploymentService.cancelDeployment(userId, deployId));
    }

    @Test
    void cancelDeployment_ShouldThrow_WhenAlreadyFinished() {
        String userId = "owner-1";
        String deployId = "dep-1";

        Deployment d = new Deployment();
        d.setId(deployId);
        d.setOwnerId(userId);
        d.setStatus(DeploymentStatus.READY); // Already done

        when(deploymentRepository.findById(deployId)).thenReturn(Optional.of(d));

        assertThrows(BadRequestException.class, () -> deploymentService.cancelDeployment(userId, deployId));
    }
}