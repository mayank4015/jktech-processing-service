import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProcessingService } from '../processing/processing.service';

@Processor('document-processing')
export class DocumentProcessor {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(private readonly processingService: ProcessingService) {}

  @Process('process-document')
  async handleDocumentProcessing(job: Job) {
    this.logger.log(`Processing job ${job.id} with data:`, job.data);

    try {
      // Update job progress
      await job.progress(0);

      // Process the document
      await this.processingService.processDocument(job.data);

      // Mark as completed
      await job.progress(100);
      this.logger.log(`Job ${job.id} completed successfully`);

      return { success: true, message: 'Document processed successfully' };
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }
}