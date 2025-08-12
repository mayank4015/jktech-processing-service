import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from './webhook.service';

@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('document-uploaded')
  @HttpCode(HttpStatus.OK)
  async handleDocumentUploaded(
    @Body() payload: any,
    @Headers('x-service-token') serviceToken: string,
  ) {
    this.validateServiceToken(serviceToken);

    const result = await this.webhookService.handleDocumentUploaded(payload);
    
    return {
      success: true,
      data: result,
      message: 'Document upload webhook processed',
    };
  }

  @Post('ingestion-cancelled')
  @HttpCode(HttpStatus.OK)
  async handleIngestionCancelled(
    @Body() payload: any,
    @Headers('x-service-token') serviceToken: string,
  ) {
    this.validateServiceToken(serviceToken);

    const result = await this.webhookService.handleIngestionCancelled(payload);
    
    return {
      success: true,
      data: result,
      message: 'Ingestion cancellation webhook processed',
    };
  }

  private validateServiceToken(token: string): void {
    const expectedToken = this.configService.get('SERVICE_TOKEN', 'main-api-token');
    
    if (!token || token !== expectedToken) {
      throw new UnauthorizedException('Invalid service token');
    }
  }
}