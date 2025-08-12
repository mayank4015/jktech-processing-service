import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('document-processing')
    private readonly documentQueue: Queue,
  ) {}

  async addJob(queueName: string, data: any, options?: any): Promise<Job> {
    this.logger.log(`Adding job to ${queueName} queue:`, data);
    
    const job = await this.documentQueue.add('process-document', data, {
      priority: data.config?.priority || 5,
      delay: options?.delay || 0,
      ...options,
    });

    this.logger.log(`Job added with ID: ${job.id}`);
    return job;
  }

  async getJob(jobId: string): Promise<Job | null> {
    return await this.documentQueue.getJob(jobId);
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job removed: ${jobId}`);
    }
  }

  async getQueueStats(): Promise<any> {
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
      total: waiting.length + active.length + completed.length + failed.length + delayed.length,
    };
  }

  async pauseQueue(): Promise<void> {
    await this.documentQueue.pause();
    this.logger.log('Queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.documentQueue.resume();
    this.logger.log('Queue resumed');
  }

  async cleanQueue(grace: number = 0): Promise<void> {
    await this.documentQueue.clean(grace, 'completed');
    await this.documentQueue.clean(grace, 'failed');
    this.logger.log('Queue cleaned');
  }
}