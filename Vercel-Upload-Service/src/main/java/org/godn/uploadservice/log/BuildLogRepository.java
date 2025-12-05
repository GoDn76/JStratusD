package org.godn.uploadservice.log;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BuildLogRepository extends JpaRepository<BuildLog, Long> {
    // Fetch logs for a project, sorted by time so they appear in order
    List<BuildLog> findByDeploymentIdOrderByTimestampAsc(String deploymentId);
    void deleteByDeploymentId(String deploymentId);
}
