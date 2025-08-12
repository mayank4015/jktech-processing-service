import { IsString, IsUUID, IsOptional, IsObject, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum ProcessingType {
  TEXT_EXTRACTION = 'text_extraction',
  OCR = 'ocr',
  ANALYSIS = 'analysis',
  FULL_PROCESSING = 'full_processing',
}

export class IngestionConfigDto {
  @IsEnum(ProcessingType)
  @IsOptional()
  processingType?: ProcessingType = ProcessingType.FULL_PROCESSING;

  @IsOptional()
  @IsObject()
  ocrSettings?: {
    language?: string;
    accuracy?: 'fast' | 'balanced' | 'accurate';
  };

  @IsOptional()
  @IsObject()
  analysisSettings?: {
    extractEntities?: boolean;
    extractTopics?: boolean;
    sentimentAnalysis?: boolean;
  };

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number = 5;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class TriggerIngestionDto {
  @IsUUID()
  documentId: string;

  @IsUUID()
  ingestionId: string;

  @IsOptional()
  @Type(() => IngestionConfigDto)
  config?: IngestionConfigDto;
}

export class IngestionStatusDto {
  @IsUUID()
  ingestionId: string;

  @IsEnum(['queued', 'processing', 'completed', 'failed'])
  status: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsObject()
  result?: any;
}