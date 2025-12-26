# JStratusD ☁️

An Open Source, Microservices-based Vercel Clone built with Spring Boot.

JStratusD is a robust Platform-as-a-Service (PaaS) engine designed to
mimic the core deployment capabilities of Vercel. It enables developers
to upload Git repository URLs, automatically triggers build pipelines
via microservices, and serves static assets through a custom edge-like
request handler.

## 🏗️ Architecture

The JStratusD system mimics the core infrastructure of Vercel using a distributed, event-driven microservices architecture designed for high scalability and fault tolerance. A central API Gateway (Spring Cloud Gateway) routes user traffic to the appropriate services, while an Upload Service orchestrates the ingestion of code via Git cloning and handles GitHub Webhook events for automatic deployments. To prevent blocking the user-facing API during resource-intensive operations, build tasks are pushed to a Redis queue and processed asynchronously by stateless Deploy Service workers running in isolated Alpine Linux containers. These workers execute npm install and build commands, stream logs in real-time to a PostgreSQL database for user visibility, and upload the final static artifacts to Cloudflare R2 (S3-compatible storage). Finally, a Cloudflare Worker at the edge dynamically intercepts incoming requests, fetches the correct static assets from storage based on the project ID, and serves the site globally with low latency, effectively decoupling the build engine from the serving layer.

``` mermaid
graph TD
    User(User / Browser)

    subgraph Infrastructure
        Gateway(API Gateway - Port 8080)
        Eureka(Eureka Server - Port 8761)
        Postgres[(PostgreSQL DB)]
        Redis[(Redis - Queue)]
    end

    subgraph Ingestion_Layer
        UserService(User Service - Port 8081)
        UploadService(Upload Service - Port 8082)
    end

    subgraph Processing_Layer
        DeployService(Deploy Service - Port 9091)
    end

    subgraph Serving_Layer
        Cloudflare(Cloudflare Worker / Edge)
        Storage(Cloudflare R2 - S3 Storage)
    end

    %% Auth Flow
    User -->|POST /auth/login| Gateway
    Gateway -->|Route| UserService
    UserService -->|Read/Write| Postgres

    %% Deployment Flow
    User -->|POST /deployments| Gateway
    Gateway -->|Route| UploadService
    UploadService -->|JGit Clone| GitService[GitHub]
    UploadService -->|Save Metadata| Postgres
    UploadService -->|Push Job ID| Redis

    %% Build Flow
    Redis -->|Poll Job| DeployService
    DeployService -->|Fetch Status| Postgres
    DeployService -->|npm install & build| DeployService
    DeployService -->|Stream Logs| Postgres
    DeployService -->|Upload Artifacts| Storage

    %% Serving Flow
    User -->|GET project.workers.dev| Cloudflare
    Cloudflare -->|Fetch HTML/JS| Storage
    Storage -->|Return Content| Cloudflare
    Cloudflare -->|Serve Site| User
```

## 🛠️ Tech Stack

-   **Core Framework:** Java 17, Spring Boot 3.2.x
-   **Build Tool:** Maven
-   **Message Broker:** Redis (Pub/Sub & Queue)
-   **Storage:** AWS S3 / MinIO
-   **Version Control:** JGit
-   **Containerization:** Docker

## 📂 Folder Structure
```
Vercel-Upload-Service/
├── Dockerfile                       <-- Standard Java Dockerfile
├── pom.xml                          <-- Dependencies (Web, JPA, Redis, S3, Eureka Client)
├── src/
│   ├── main/
│   │   ├── resources/
│   │   │   └── application.yml      <-- Config: Port 8082, DB, Redis, S3, Eureka
│   │   │
│   │   └── java/org/godn/verceluploadservice/
│   │       │
│   │       ├── VercelUploadServiceApplication.java <-- @EnableAsync, @EnableDiscoveryClient
│   │       │
│   │       ├── config/
│   │       │   ├── AppConfig.java           <-- General Beans
│   │       │   └── AsyncConfig.java         <-- @EnableAsync Configuration
│   │       │
│   │       ├── deployment/              <-- DOMAIN: Shared Logic & Data
│   │       │   ├── Deployment.java           (Entity)
│   │       │   ├── DeploymentStatus.java     (Enum: QUEUED, BUILDING, READY...)
│   │       │   ├── DeploymentRepository.java (DB Access)
│   │       │   ├── DeploymentService.java    (Logic: Limits, Cancel, Delete, Get)
│   │       │   ├── DeploymentController.java (API: POST /deploy, GET /status, DELETE)
│   │       │   ├── DeploymentResponseDto.java(Output DTO)
│   │       │   ├── BuildLog.java             (Entity: Logs)
│   │       │   ├── BuildLogRepository.java   (DB Access: Logs)
│   │       │   ├── ProjectSecret.java        (Entity: Env Vars)
│   │       │   └── ProjectSecretRepository.java (DB Access: Env Vars)
│   │       │
│   │       ├── upload/                  <-- FEATURE: Ingestion
│   │       │   ├── UploadService.java        (Orchestrator: Git -> S3 -> Redis)
│   │       │   ├── UploadController.java     (Can be merged into DeploymentController)
│   │       │   ├── UploadRequestDto.java     (Input: repoUrl, secrets)
│   │       │   ├── UploadResponseDto.java    (Output: id, status)
│   │       │   └── SecretsDto.java           (Input: Map of secrets)
│   │       │
│   │       ├── controller/              <-- FEATURE: Webhooks
│   │       │   └── WebhookController.java    (GitHub Push Events)
│   │       │
│   │       ├── queue/                   <-- INFRASTRUCTURE: Redis
│   │       │   └── RedisQueueService.java    (Producer: pushToQueue)
│   │       │
│   │       ├── storage/                 <-- INFRASTRUCTURE: S3/R2
│   │       │   └── S3UploadService.java      (Synchronous Upload Logic)
│   │       │
│   │       ├── util/
│   │       │   └── GenerateId.java           (Base62 Generator)
│   │       │
│   │       └── exception/               <-- ERROR HANDLING
│   │           ├── GlobalExceptionHandler.java
│   │           ├── BadRequestException.java
│   │           ├── ResourceNotFoundException.java
│   │           └── UnauthorizedException.java
Vercel-Deploy-Service/
├── Dockerfile                       <-- Special: Alpine + Node.js 20 Installed
├── pom.xml                          <-- Dependencies (JPA, Redis, S3, Eureka Client - Exclude Jersey!)
├── src/
│   ├── main/
│   │   ├── resources/
│   │   │   └── application.yml      <-- Config: Port 9091, Same DB/Redis/S3 Credentials
│   │   │
│   │   └── java/org/godn/verceldeployservice/
│   │       │
│   │       ├── VercelDeployServiceApplication.java <-- @EnableDiscoveryClient
│   │       │
│   │       ├── config/
│   │       │   └── BuildExecutorConfig.java <-- Thread Pool Config (Size = 1)
│   │       │
│   │       ├── deployment/              <-- DOMAIN: COPIED FROM UPLOAD SERVICE
│   │       │   ├── Deployment.java           (Must match Upload Service exactly)
│   │       │   ├── DeploymentStatus.java     (Must match Upload Service exactly)
│   │       │   ├── DeploymentRepository.java (Must match Upload Service exactly)
│   │       │   ├── BuildLog.java             (Must match Upload Service exactly)
│   │       │   ├── BuildLogRepository.java   (Must match Upload Service exactly)
│   │       │   ├── ProjectSecret.java        (Must match Upload Service exactly)
│   │       │   └── ProjectSecretRepository.java (Must match Upload Service exactly)
│   │       │
│   │       ├── queue/                   <-- CORE LOGIC
│   │       │   ├── RedisQueueService.java    (Consumer: popFromQueue)
│   │       │   └── RedisListenerService.java (The Brain: Poll -> Lock -> Build -> Update)
│   │       │
│   │       ├── build/                   <-- FEATURE: Building
│   │       │   └── BuildService.java         (npm install -> npm run build -> Save Logs)
│   │       │
│   │       ├── download/                <-- FEATURE: Downloading
│   │       │   └── DownloadService.java      (Orchestrator: Download S3 folder)
│   │       │
│   │       ├── service/                 <-- FEATURE: Uploading Artifacts
│   │       │   └── BuildUploadService.java   (Orchestrator: Upload 'dist' folder)
│   │       │
│   │       └── storage/                 <-- INFRASTRUCTURE: S3/R2
│   │           └── S3UploadService.java      (Synchronous Upload Logic - Same as Upload Service)
│   │           └── S3DownloadService.java    (Synchronous Download Logic)
│   │           └── S3Properties.java         (Configuration Mapping)
```
## 🚀 Setup & Run Instructions

### Prerequisites

-   Java 17+
-   Maven 3.8+
-   Redis
-   Docker (optional)

### 1. Start Redis

``` bash
docker run -d --name jstratus-redis -p 6379:6379 redis:alpine
```

### 2. Clone the Repository

``` bash
git clone https://github.com/GoDn76/JStratusD.git
cd JStratusD
```

## ⚙️ Configuration

Using .env.example include all the required values
### Upload-Service
```Upload-Service
DB_URL=
DB_USERNAME=
DB_PASSWORD=
BUILD_QUEUE=
R2_REGION=
R2_BUCKET_NAME=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_ENDPOINT=
UPSTASH_REDIS_REST_HOST=
UPSTASH_REDIS_REST_TOKEN=
REDIS_PORT=
```
### Deploy-Service
```Deploy-Service
DB_URL=
DB_USERNAME=
DB_PASSWORD=
BUILD_QUEUE=
R2_REGION=
R2_BUCKET_NAME=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_ENDPOINT=
UPSTASH_REDIS_REST_HOST=
UPSTASH_REDIS_REST_TOKEN=
REDIS_PORT=
WORKER_WEBSITE_URL=
```


## 🐳 Run using Docker
(Note - you can use docker compose but for now using docker.)
### Upload-Service
```bash
cd ./Upload-Service
mvn clean package
docker build -t upload-s .
docker run --env-file .\.env --rm -p 8081:8081 upload-s
```
### Deploy-Service

```bash
cd ./Deploy-Service
mvn clean package
docker build -t deploy-s .
docker run --env-file .\.env --rm deploy-s
```

# API Documentation

## 🔐 1. Authentication (User Service)

### Register User

**Endpoint:** `POST /auth/register`

**Body:**

``` json
{
  "name": "godn",
  "email": "godn@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK` (JWT Token)

------------------------------------------------------------------------

### Login

**Endpoint:** `POST /auth/login`

**Body:**

``` json
{
  "email": "godn@example.com",
  "password": "securepassword123"
}
```

**Response:**

``` json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "bearer"
}
```

------------------------------------------------------------------------

## 🚀 2. Deployments (Upload Service)

### Create Deployment

**Endpoint:** `POST /deployments`

**Body:**

``` json
{
  "repoUrl": "https://github.com/godn/my-react-app.git",
  "branch": "main",
  "secrets": {
    "REACT_APP_API_URL": "https://api.myapp.com"
  }
}
```

**Response:**

``` json
{
  "success": true,
  "message": "Deployment Queued",
  "projectId": "0E9L6"
}
```

------------------------------------------------------------------------

### Get All Deployments

**Endpoint:** `GET /deployments`

**Response:**

``` json
[
  {
    "id": "0E9L6",
    "status": "READY",
    "repositoryUrl": "https://github.com/godn/my-react-app.git",
    "websiteUrl": "https://vc-r.godn.workers.dev/view/0E9L6",
    "createdAt": "2023-10-27T10:00:00"
  }
]
```

------------------------------------------------------------------------

### Get Deployment Details

**Endpoint:** `GET /deployments/{id}`\
**Response:** *Same DTO as above*

------------------------------------------------------------------------

### Cancel Deployment

**Endpoint:** `POST /deployments/{id}/cancel`\
**Response:**\
`Deployment cancelled successfully.`

------------------------------------------------------------------------

### Delete Deployment

**Endpoint:** `DELETE /deployments/{id}`\
**Response:**\
`Deployment deleted successfully.`

------------------------------------------------------------------------

## 📜 3. Logs & Monitoring

### Get Build Logs

Poll every 2 seconds for real-time updates.

**Endpoint:** `GET /deployments/{id}/logs`

**Response:**

``` json
[
  {
    "id": 101,
    "deploymentId": "0E9L6",
    "content": "[npm-build] Installing dependencies...",
    "timestamp": "2023-10-27T10:00:05"
  },
  {
    "id": 102,
    "deploymentId": "0E9L6",
    "content": "[npm-build] Build complete.",
    "timestamp": "2023-10-27T10:01:20"
  }
]
```


## 📊 Deployment Status Enum
```
  Status          Meaning
  --------------- -----------------------
  QUEUED          Waiting for worker
  BUILDING        Installing/building
  READY           Deployment successful
  FAILED          Build error
  CANCELLED       User cancelled
  TIMED_OUT       Exceeded 20 min limit
```
## 🤝 Contribution

1.  Fork repo
2.  Create a branch
3.  Commit changes
4.  Open a PR

---

## 👤 Author

Gaurav Uramliya

## 📄 License

MIT License.
