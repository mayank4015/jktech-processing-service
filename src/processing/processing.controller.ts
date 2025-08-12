import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProcessingService } from './processing.service';
import { TriggerIngestionDto, IngestionConfigDto } from './dto/processing.dto';

@Controller('processing')
export class ProcessingController {
  constructor(private readonly processingService: ProcessingService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerIngestion(@Body() triggerDto: TriggerIngestionDto) {
    const result = await this.processingService.triggerIngestion(
      triggerDto.documentId,
      triggerDto.ingestionId,
      triggerDto.config,
    );

    return {
      success: true,
      data: result,
      message: 'Document processing initiated',
    };
  }

  @Get('status/:ingestionId')
  async getIngestionStatus(@Param('ingestionId') ingestionId: string) {
    const status = await this.processingService.getIngestionStatus(ingestionId);
    
    return {
      success: true,
      data: status,
    };
  }

  @Post('cancel/:ingestionId')
  @HttpCode(HttpStatus.OK)
  async cancelIngestion(@Param('ingestionId') ingestionId: string) {
    const result = await this.processingService.cancelIngestion(ingestionId);
    
    return {
      success: true,
      data: result,
      message: 'Ingestion cancelled successfully',
    };
  }

  @Get('queue/stats')
  async getQueueStats() {
    const stats = await this.processingService.getQueueStats();
    
    return {
      success: true,
      data: stats,
    };
  }
}