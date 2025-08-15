export interface ProcessingConfig {
  extractText: boolean;
  performOCR: boolean;
  extractKeywords: boolean;
  generateSummary: boolean;
  detectLanguage: boolean;
  enableSearch: boolean;
  priority: "low" | "normal" | "high";
}

export interface DocumentProcessingJob {
  documentId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  config: ProcessingConfig;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  uploadedAt: Date;
  [key: string]: any;
}

export interface ProcessingResult {
  documentId: string;
  success: boolean;
  extractedText?: string;
  ocrText?: string;
  keywords?: string[];
  summary?: string;
  language?: string;
  metadata?: Record<string, any>;
  processingTime: number;
  errors?: string[];
}

export interface ProcessingProgress {
  jobId: string;
  documentId: string;
  status: ProcessingStatus;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export enum ProcessingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}
