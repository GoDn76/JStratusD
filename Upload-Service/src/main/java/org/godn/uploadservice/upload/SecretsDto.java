package org.godn.uploadservice.upload;

import lombok.Data;
import java.util.Map;

@Data
public class SecretsDto {
    // Example JSON: { "secrets": { "API_KEY": "123", "DB_HOST": "localhost" } }
    private Map<String, String> secrets;
}