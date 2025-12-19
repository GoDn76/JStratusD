package org.godn.deployservice.deployment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, String> {

    /**
     * 1. History: Find all deployments for a specific user.
     */
    List<Deployment> findAllByOwnerIdOrderByCreatedAtDesc(String ownerId);

    /**
     * 2. Limits: Find all currently active deployments for a user.
     */
    List<Deployment> findAllByOwnerIdAndStatusIn(String ownerId, List<DeploymentStatus> statuses);

    /**
     * 3. Idempotency (API Level): Check if THIS USER is already building THIS REPO.
     * Prevents double-clicks, but allows User B to build the same repo as User A.
     */
    @Query("SELECT d FROM Deployment d " +
            "WHERE d.repositoryUrl = :url " +
            "AND d.ownerId = :ownerId " +
            "AND d.status IN ('QUEUED', 'BUILDING')")
    Optional<Deployment> findActiveDeployment(
            @Param("url") String url,
            @Param("ownerId") String ownerId
    );

    /**
     * 4. Idempotency (Worker Level): Atomically "claim" a job.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Deployment d SET d.status = 'BUILDING' WHERE d.id = :id AND d.status IN ('QUEUED', 'READY')")
    int lockDeployment(@Param("id") String id);

    long countByOwnerId(String ownerId);
}