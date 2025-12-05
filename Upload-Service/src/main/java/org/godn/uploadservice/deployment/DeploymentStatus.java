package org.godn.uploadservice.deployment;

public enum DeploymentStatus{
    QUEUED,
    BUILDING,
    READY,
    FAILED,
    CANCELLED,
    TIMED_OUT
}
