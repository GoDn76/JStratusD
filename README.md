# Vercel-Clone
## Vercel Clone Using Spring Boot
### Folder Structure of the Project
```
vercel-clone/
├── pom.xml                      # Parent pom.xml (for multi-module build)
├── README.md

├── upload-service/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/vercel/upload/
│       │   │   ├── UploadServiceApplication.java
│       │   │   ├── controller/UploadController.java
│       │   │   ├── service/UploadService.java
│       │   │   ├── dto/
│       │   │   │   ├── UploadRequestDTO.java
│       │   │   │   └── UploadResponseDTO.java
│       │   │   ├── config/CorsConfig.java
│       │   │   ├── util/StorageUtil.java
│       │   │   ├── exception/
│       │   │   │   ├── CustomException.java
│       │   │   │   └── GlobalExceptionHandler.java
│       │   └── resources/application.properties
│       └── test/java/com/vercel/upload/UploadServiceApplicationTests.java

├── deploy-service/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/vercel/deploy/
│       │   │   ├── DeployServiceApplication.java
│       │   │   ├── controller/DeployController.java
│       │   │   ├── service/DeployService.java
│       │   │   ├── dto/
│       │   │   │   ├── DeployRequestDTO.java
│       │   │   │   └── DeployResponseDTO.java
│       │   │   ├── config/CorsConfig.java
│       │   │   ├── util/GitUtil.java
│       │   │   ├── exception/
│       │   │   │   ├── DeployException.java
│       │   │   │   └── GlobalExceptionHandler.java
│       │   └── resources/application.properties
│       └── test/java/com/vercel/deploy/DeployServiceApplicationTests.java

├── request-handler/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/vercel/request/
│       │   │   ├── RequestHandlerApplication.java
│       │   │   ├── controller/RequestController.java
│       │   │   ├── service/RequestService.java
│       │   │   ├── dto/
│       │   │   │   ├── RequestDTO.java
│       │   │   │   └── ResponseDTO.java
│       │   │   ├── config/CorsConfig.java
│       │   │   ├── util/RequestUtil.java
│       │   │   ├── exception/
│       │   │   │   ├── RequestException.java
│       │   │   │   └── GlobalExceptionHandler.java
│       │   └── resources/application.properties
│       └── test/java/com/vercel/request/RequestHandlerApplicationTests.java
```