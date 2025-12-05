package org.godn.uploadservice.log; // (Change package for Deploy Service)

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "build_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String deploymentId; // Links log to a specific build

    @Column(nullable = false, length = 5000) // Allow long lines
    private String content;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}