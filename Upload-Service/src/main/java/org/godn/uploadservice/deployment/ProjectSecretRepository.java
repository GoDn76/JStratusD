package org.godn.uploadservice.deployment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectSecretRepository extends JpaRepository<ProjectSecret, Long> {
    List<ProjectSecret> findByProjectId(String projectId);
    Optional<ProjectSecret> findByProjectIdAndKey(String projectId, String key);
    void deleteByProjectId(String projectId);
}