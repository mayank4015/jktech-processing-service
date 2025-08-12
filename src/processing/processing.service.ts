import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '../queue/queue.service';
import { DocumentAnalysisService } from './document-analysis.service';
import { IngestionConfigDto } from './dto/processing.dto';

export interface IngestionJob {
  id: string;
  documentId: string;
  ingestionId: string;
  config: IngestionConfigDto;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);
  private readonly jobs = new Map<string, IngestionJob>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    private readonly documentAnalysisService: DocumentAnalysisService,
  ) {}

  async triggerIngestion(
    documentId: string,
    ingestionId: string,
    config: IngestionConfigDto,
  ): Promise<{ jobId: string; status: string }> {
    this.logger.log(`Triggering ingestion for document: ${documentId}`);

    const job: IngestionJob = {
      id: ingestionId,
      documentId,
      ingestionId,
      config,
      status: 'queued',
      progress: 0,
    };

    this.jobs.set(ingestionId, job);

    // Add to processing queue
    await this.queueService.addJob('document-processing', {
      ingestionId,
      documentId,
      config,
    });

    // Notify main API that processing has started
    this.notifyMainAPI(ingestionId, 'queued', 0);

    return {
      jobId: ingestionId,
      status: 'queued',
    };
  }

  async processDocument(jobData: any): Promise<void> {
    const { ingestionId, documentId, config } = jobData;
    const job = this.jobs.get(ingestionId);

    if (!job) {
      this.logger.error(`Job not found: ${ingestionId}`);
      return;
    }

    try {
      this.logger.log(`Starting processing for ingestion: ${ingestionId}`);
      
      // Update job status
      job.status = 'processing';
      job.startedAt = new Date();
      job.progress = 10;
      this.jobs.set(ingestionId, job);

      // Notify main API
      await this.notifyMainAPI(ingestionId, 'processing', 10);

      // Simulate document analysis phases
      await this.simulateProcessingPhases(job);

      // Complete the job
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;
      job.result = {
        extractedText: 'Sample extracted text content...',
        metadata: {
          pageCount: 5,
          wordCount: 1250,
          language: 'en',
        },
        analysis: {
          sentiment: 'neutral',
          topics: ['business', 'technology'],
          entities: ['Company A', 'Product B'],
        },
      };

      this.jobs.set(ingestionId, job);

      // Notify main API of completion
      await this.notifyMainAPI(ingestionId, 'completed', 100, job.result);

      this.logger.log(`Processing completed for ingestion: ${ingestionId}`);
    } catch (error) {
      this.logger.error(`Processing failed for ingestion: ${ingestionId}`, error);
      
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error.message;
      this.jobs.set(ingestionId, job);

      // Notify main API of failure
      await this.notifyMainAPI(ingestionId, 'failed', job.progress, null, error.message);
    }
  }

  private async simulateProcessingPhases(job: IngestionJob): Promise<void> {
    const phases = [
      { name: 'Document Download', progress: 20, duration: 1000 },
      { name: 'Text Extraction', progress: 40, duration: 2000 },
      { name: 'Content Analysis', progress: 60, duration: 3000 },
      { name: 'Metadata Extraction', progress: 80, duration: 1500 },
      { name: 'Indexing', progress: 95, duration: 1000 },
    ];

    for (const phase of phases) {
      this.logger.log(`Processing phase: ${phase.name} for ${job.ingestionId}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, phase.duration));
      
      // Update progress
      job.progress = phase.progress;
      this.jobs.set(job.ingestionId, job);
      
      // Notify main API of progress
      await this.notifyMainAPI(job.ingestionId, 'processing', phase.progress);
    }
  }

  async getIngestionStatus(ingestionId: string): Promise<IngestionJob | null> {
    return this.jobs.get(ingestionId) || null;
  }

  async cancelIngestion(ingestionId: string): Promise<{ cancelled: boolean }> {
    const job = this.jobs.get(ingestionId);
    
    if (!job) {
      return { cancelled: false };
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return { cancelled: false };
    }

    job.status = 'failed';
    job.error = 'Cancelled by user';
    job.completedAt = new Date();
    this.jobs.set(ingestionId, job);

    // Notify main API
    await this.notifyMainAPI(ingestionId, 'failed', job.progress, null, 'Cancelled by user');

    return { cancelled: true };
  }

  async getQueueStats(): Promise<any> {
    const stats = await this.queueService.getQueueStats();
    
    return {
      ...stats,
      activeJobs: Array.from(this.jobs.values()).filter(job => 
        job.status === 'processing' || job.status === 'queued'
      ).length,
      completedJobs: Array.from(this.jobs.values()).filter(job => 
        job.status === 'completed'
      ).length,
      failedJobs: Array.from(this.jobs.values()).filter(job => 
        job.status === 'failed'
      ).length,
    };
  }

  private async notifyMainAPI(
    ingestionId: string,
    status: string,
    progress: number,
    result?: any,
    error?: string,
  ): Promise<void> {
    try {
      const mainApiUrl = this.configService.get('MAIN_API_URL', 'http://localhost:8080');
      const webhookUrl = `${mainApiUrl}/webhooks/ingestion-status`;

      const payload = {
        ingestionId,
        status,
        progress,
        timestamp: new Date().toISOString(),
        ...(result && { result }),
        ...(error && { error }),
      };

      await this.httpService.axiosRef.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Token': this.configService.get('SERVICE_TOKEN', 'processing-service-token'),
        },
        timeout: 5000,
      });

      this.logger.log(`Notified main API: ${ingestionId} -> ${status}`);
    } catch (error) {
      this.logger.error(`Failed to notify main API for ${ingestionId}:`, error.message);
    }
  }
}