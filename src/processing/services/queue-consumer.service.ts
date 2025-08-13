import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Queue, Job } from "bull";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { DocumentProcessorService } from "./document-processor.service";
import { DocumentProcessingJob } from "../dto/processing.dto";

@Injectable()
@Processor("document-processing")
export class QueueConsumerService implements OnModuleInit {
  private readonly logger = new Logger(QueueConsumerService.name);

  constructor(
    @InjectQueue("document-processing")
    private readonly documentQueue: Queue<DocumentProcessingJob>,
    private readonly documentProcessor: DocumentProcessorService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    this.logger.log("Queue consumer service initialized");

    // Set up queue event listeners
    this.documentQueue.on("completed", async (job: Job, result: any) => {
      this.logger.log(`Job ${job.id} completed successfully`);
      await this.sendCompletionCallback(job.data.documentId, result);
    });

    this.documentQueue.on("failed", async (job: Job, err: Error) => {
      this.logger.error(`Job ${job.id} failed:`, err.message);
      await this.sendFailureCallback(job.data.documentId, err.message);
    });

    this.documentQueue.on("stalled", (job: Job) => {
      this.logger.warn(`Job ${job.id} stalled`);
    });

    this.documentQueue.on("progress", (job: Job, progress: number) => {
      this.logger.log(`Job ${job.id} progress: ${progress}%`);
    });
  }

  @Process("process-document")
  async processDocument(job: Job<DocumentProcessingJob>) {
    this.logger.log(
      `Processing job ${job.id} for document ${job.data.documentId}`
    );

    try {
      // Update job progress
      await job.progress(0);

      // Process the document with job instance for progress updates
      const result = await this.documentProcessor.processDocument(
        job.data,
        job
      );

      // Update final progress
      await job.progress(100);

      this.logger.log(`Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.documentQueue.getWaiting(),
      this.documentQueue.getActive(),
      this.documentQueue.getCompleted(),
      this.documentQueue.getFailed(),
      this.documentQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async getActiveJobs() {
    return this.documentQueue.getActive();
  }

  async getWaitingJobs() {
    return this.documentQueue.getWaiting();
  }

  async getFailedJobs() {
    return this.documentQueue.getFailed();
  }

  async getCompletedJobs() {
    return this.documentQueue.getCompleted();
  }

  async pauseQueue() {
    await this.documentQueue.pause();
    this.logger.log("Queue paused");
  }

  async resumeQueue() {
    await this.documentQueue.resume();
    this.logger.log("Queue resumed");
  }

  async cleanQueue() {
    await this.documentQueue.clean(5000, "completed" as any);
    await this.documentQueue.clean(5000, "failed" as any);
    this.logger.log("Queue cleaned");
  }

  private async sendCompletionCallback(documentId: string, result: any) {
    try {
      const backendUrl = this.configService.get("MAIN_BACKEND_URL");
      const serviceToken = this.configService.get("SERVICE_TOKEN");

      if (!backendUrl || !serviceToken) {
        this.logger.warn("Missing backend URL or service token for callback");
        return;
      }

      const callbackData = {
        documentId,
        result: {
          success: true,
          processingTime: result.processingTime || 0,
          extractedText: result.extractedText,
          ocrText: result.ocrText,
          keywords: result.keywords,
          summary: result.summary,
          language: result.language,
        },
      };

      await firstValueFrom(
        this.httpService.post(
          `${backendUrl}/api/v1/processing/callback`,
          callbackData,
          {
            headers: {
              "x-service-token": serviceToken,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        )
      );

      this.logger.log(`Completion callback sent for document ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send completion callback for document ${documentId}:`,
        error.message
      );
    }
  }

  private async sendFailureCallback(documentId: string, errorMessage: string) {
    try {
      const backendUrl = this.configService.get("MAIN_BACKEND_URL");
      const serviceToken = this.configService.get("SERVICE_TOKEN");

      if (!backendUrl || !serviceToken) {
        this.logger.warn("Missing backend URL or service token for callback");
        return;
      }

      const callbackData = {
        documentId,
        result: {
          success: false,
          processingTime: 0,
          errors: [errorMessage],
        },
      };

      await firstValueFrom(
        this.httpService.post(
          `${backendUrl}/api/v1/processing/callback`,
          callbackData,
          {
            headers: {
              "x-service-token": serviceToken,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        )
      );

      this.logger.log(`Failure callback sent for document ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send failure callback for document ${documentId}:`,
        error.message
      );
    }
  }
}
