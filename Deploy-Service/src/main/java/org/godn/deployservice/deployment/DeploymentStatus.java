package org.godn.deployservice.deployment;

public enum DeploymentStatus{
    QUEUED,
    BUILDING,
    READY,
    FAILED,
    CANCELLED,
    TIMED_OUT
}
