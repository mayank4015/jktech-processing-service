import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  async handleDocumentUploaded(payload: any): Promise<any> {
    this.logger.log('Received document uploaded webhook:', payload);

    // Process the webhook payload
    // This could trigger additional processing or validation
    
    return {
      processed: true,
      documentId: payload.documentId,
      timestamp: new Date().toISOString(),
    };
  }

  async handleIngestionCancelled(payload: any): Promise<any> {
    this.logger.log('Received ingestion cancelled webhook:', payload);

    // Handle ingestion cancellation
    // This could clean up resources or update internal state
    
    return {
      processed: true,
      ingestionId: payload.ingestionId,
      timestamp: new Date().toISOString(),
    };
  }
}