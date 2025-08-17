# JKTech Processing Service

A dedicated NestJS microservice for handling document processing, text extraction, and AI-powered analysis. This service works in conjunction with the main JKTech backend to provide scalable document processing capabilities.

## Features

- **Framework**: NestJS 11.x with TypeScript 5.7.x
- **Queue Management**: Bull Queue with Redis for job processing
- **Microservice Architecture**: Event-driven communication with main backend
- **Document Processing**: Text extraction, OCR, and content analysis
- **Scalability**: Horizontal scaling with multiple worker instances
- **Health Monitoring**: Comprehensive health checks and monitoring
- **Error Handling**: Robust error handling with retry mechanisms
- **Logging**: Structured logging for debugging and monitoring

## Project Structure

```
src/
├── app.controller.ts       # Main application controller
├── app.module.ts          # Root application module
├── app.service.ts         # Main application service
├── main.ts                # Application entry point
├── common/                # Shared utilities and services
│   ├── decorators/        # Custom decorators
│   ├── filters/           # Exception filters
│   ├── guards/            # Authentication guards
│   ├── interceptors/      # Request/response interceptors
│   └── pipes/             # Validation pipes
├── config/                # Configuration service
│   └── configuration.ts   # Environment configuration
├── health/                # Health check endpoints
│   ├── health.controller.ts
│   └── health.module.ts
├── processing/            # Document processing module
│   ├── processors/        # Different document processors
│   ├── queues/           # Bull queue configurations
│   ├── services/         # Processing services
│   └── processing.module.ts
└── webhooks/             # Webhook handlers for external services
    ├── webhooks.controller.ts
    └── webhooks.module.ts
```

## Getting Started

### Prerequisites

- **Node.js**: 20.x or higher
- **Redis**: 6.x or higher (for Bull Queue)
- **Package Manager**: npm or yarn
- **JKTech Backend**: Main backend service running

### Installation

1. **Clone the repository and navigate to the processing service directory:**

   ```bash
   cd jktech-processing-service
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   # Server Configuration
   PORT=8081
   NODE_ENV=development

   # Redis Configuration (REQUIRED)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0

   # Main Backend Configuration (REQUIRED)
   MAIN_BACKEND_URL=http://localhost:8080
   MAIN_BACKEND_API_PREFIX=/api/v1

   # Service Authentication (REQUIRED)
   SERVICE_TOKEN=processing-service-token

   # Processing Configuration
   MAX_CONCURRENT_JOBS=5
   PROCESSING_TIMEOUT=300000

   # Logging
   LOG_LEVEL=info
   ```

4. **Start Redis server:**

   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:7-alpine

   # Or install Redis locally
   # macOS: brew install redis && brew services start redis
   # Ubuntu: sudo apt install redis-server && sudo systemctl start redis
   ```

5. **Start the development server:**
   ```bash
   npm run start:dev
   ```

The service will be available at `http://localhost:8081`

## Available Scripts

### Development

- `npm run build` - Build the application
- `npm run start` - Start the production server
- `npm run start:dev` - Start development server with hot reload
- `npm run start:debug` - Start development server with debugging

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

### Testing

- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests

## Processing Pipeline

The service handles document processing through a multi-stage pipeline:

### 1. Job Reception

- Receives processing requests from main backend
- Validates document metadata and accessibility
- Queues job for processing

### 2. Document Analysis

- Downloads document from storage
- Determines document type and processing strategy
- Extracts metadata (size, pages, format, etc.)

### 3. Content Extraction

- **Text Documents**: Direct text extraction
- **PDFs**: PDF parsing with text and image extraction
- **Images**: OCR processing for text recognition
- **Office Documents**: Conversion and text extraction

### 4. Content Processing

- Text cleaning and normalization
- Language detection
- Content chunking for AI processing
- Keyword and entity extraction

### 5. AI Analysis (Future Enhancement)

- Semantic analysis
- Topic classification
- Summary generation
- Question-answer pair generation

### 6. Result Delivery

- Sends processed content back to main backend
- Updates processing status
- Handles error reporting and retry logic

## API Endpoints

### Health Endpoints

- `GET /` - Service status
- `GET /health` - Health check
- `GET /health/redis` - Redis connectivity check
- `GET /health/backend` - Main backend connectivity check

### Processing Endpoints (Internal)

- `POST /processing/start` - Start document processing job
- `GET /processing/status/:jobId` - Get job status
- `DELETE /processing/cancel/:jobId` - Cancel processing job

### Webhook Endpoints

- `POST /webhooks/processing-complete` - Processing completion webhook
- `POST /webhooks/processing-failed` - Processing failure webhook

## Authentication

The service uses token-based authentication for communication with the main backend:

- **Service Token**: Shared secret for service-to-service communication
- **Request Validation**: All requests validated against service token
- **Secure Communication**: HTTPS in production environments

## Queue Management

The service uses Bull Queue for robust job processing:

### Queue Configuration

- **Concurrency**: Configurable concurrent job processing
- **Retry Logic**: Automatic retry with exponential backoff
- **Job Prioritization**: Priority-based job processing
- **Dead Letter Queue**: Failed job handling

### Queue Monitoring

- Job status tracking
- Processing metrics
- Error rate monitoring
- Performance analytics

### Queue Operations

```typescript
// Add a processing job
await processingQueue.add("process-document", {
  documentId: "doc-123",
  userId: "user-456",
  processingOptions: {
    extractText: true,
    generateSummary: false,
    detectLanguage: true,
  },
});

// Get job status
const job = await processingQueue.getJob(jobId);
const status = await job.getState();
```

## Configuration

### Environment Variables

| Variable              | Description         | Default     | Required |
| --------------------- | ------------------- | ----------- | -------- |
| `PORT`                | Service port        | 8081        | No       |
| `NODE_ENV`            | Environment         | development | No       |
| `REDIS_HOST`          | Redis host          | localhost   | Yes      |
| `REDIS_PORT`          | Redis port          | 6379        | Yes      |
| `REDIS_PASSWORD`      | Redis password      | -           | No       |
| `MAIN_BACKEND_URL`    | Backend URL         | -           | Yes      |
| `SERVICE_TOKEN`       | Auth token          | -           | Yes      |
| `MAX_CONCURRENT_JOBS` | Max concurrent jobs | 5           | No       |
| `PROCESSING_TIMEOUT`  | Job timeout (ms)    | 300000      | No       |
| `LOG_LEVEL`           | Logging level       | info        | No       |

### Processing Configuration

```typescript
// Processing options
interface ProcessingOptions {
  extractText: boolean;
  extractImages: boolean;
  generateSummary: boolean;
  detectLanguage: boolean;
  chunkSize: number;
  maxPages?: number;
}
```

## Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t jktech-processing-service .

# Run with Docker Compose
docker-compose up -d
```

### Production Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Start the production server:**
   ```bash
   npm run start:prod
   ```

### Scaling

The service can be horizontally scaled:

```bash
# Run multiple instances
npm run start:prod -- --port 8081
npm run start:prod -- --port 8082
npm run start:prod -- --port 8083
```

## Monitoring

### Health Checks

- Service health endpoint
- Redis connectivity
- Backend connectivity
- Queue health status

### Metrics

- Processing job metrics
- Queue depth monitoring
- Error rate tracking
- Performance metrics

### Logging

- Structured JSON logging
- Request/response logging
- Error tracking with context
- Performance logging

## Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- Unit tests for services and utilities
- Integration tests for queue operations
- E2E tests for complete processing workflows
- Mock services for external dependencies

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify connection parameters
   - Check network connectivity

2. **Processing Jobs Stuck**
   - Check queue health
   - Verify worker processes
   - Review job logs

3. **Backend Communication Failed**
   - Verify backend URL and token
   - Check network connectivity
   - Review authentication setup

### Debug Mode

```bash
# Start with debug logging
LOG_LEVEL=debug npm run start:dev

# Enable debug for specific modules
DEBUG=processing:* npm run start:dev
```

## Contributing

1. Follow NestJS best practices
2. Write comprehensive tests
3. Use TypeScript strictly
4. Document new features
5. Follow conventional commit messages

## License

This project is licensed under the UNLICENSED License.

## Related Projects

- [JKTech Backend](../JKTech-backend/README.md) - Main API server
- [JKTech Frontend](../jktech-frontend/README.md) - Web application
