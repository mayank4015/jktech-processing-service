import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Queue, Job } from "bull";
import { DocumentProcessorService } from "./document-processor.service";
import { DocumentProcessingJob } from "../dto/processing.dto";

@Injectable()
@Processor("document-processing")
export class QueueConsumerService implements OnModuleInit {
  private readonly logger = new Logger(QueueConsumerService.name);

  constructor(
    @InjectQueue("document-processing")
    private readonly documentQueue: Queue<DocumentProcessingJob>,
    private readonly documentProcessor: DocumentProcessorService
  ) {}

  async onModuleInit() {
    this.logger.log("Queue consumer service initialized");

    // Set up queue event listeners
    this.documentQueue.on("completed", (job: Job, result: any) => {
      this.logger.log(`Job ${job.id} completed successfully`);
    });

    this.documentQueue.on("failed", (job: Job, err: Error) => {
      this.logger.error(`Job ${job.id} failed:`, err.message);
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

      // Process the document
      const result = await this.documentProcessor.processDocument(job.data);

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
    await this.documentQueue.clean(5000, "completed");
    await this.documentQueue.clean(5000, "failed");
    this.logger.log("Queue cleaned");
  }
}
