import { Injectable, Logger } from "@nestjs/common";
import { QueueConsumerService } from "../processing/services/queue-consumer.service";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly queueConsumer: QueueConsumerService) {}

  async getHealthStatus() {
    const startTime = Date.now();

    try {
      // Test queue connection
      const queueStats = await this.queueConsumer.getQueueStats();
      const queueStatus = "healthy";

      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        service: "jktech-processing-service",
        timestamp: new Date().toISOString(),
        responseTime,
        services: {
          queue: queueStatus,
        },
        queue: queueStats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || "1.0.0",
      };
    } catch (error) {
      this.logger.error("Health check failed:", error);

      return {
        status: "unhealthy",
        service: "jktech-processing-service",
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error.message,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || "1.0.0",
      };
    }
  }

  async getQueueHealth() {
    try {
      const stats = await this.queueConsumer.getQueueStats();
      const activeJobs = await this.queueConsumer.getActiveJobs();
      const waitingJobs = await this.queueConsumer.getWaitingJobs();

      return {
        status: "healthy",
        stats,
        activeJobs: activeJobs.length,
        waitingJobs: waitingJobs.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("Queue health check failed:", error);

      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
