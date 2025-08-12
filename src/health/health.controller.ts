import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    const health = await this.healthService.getHealthStatus();
    return {
      success: true,
      data: health,
    };
  }

  @Get("queue")
  async getQueueHealth() {
    const queueHealth = await this.healthService.getQueueHealth();
    return {
      success: true,
      data: queueHealth,
    };
  }
}
