import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import {
  DocumentProcessingJob,
  ProcessingResult,
  ProcessingConfig,
} from "../dto/processing.dto";

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async processDocument(job: DocumentProcessingJob): Promise<ProcessingResult> {
    const startTime = Date.now();
    const result: ProcessingResult = {
      documentId: job.documentId,
      success: false,
      processingTime: 0,
      errors: [],
    };

    try {
      this.logger.log(`Starting processing for document ${job.documentId}`);

      // Step 1: Extract text if enabled
      if (job.config.extractText) {
        await this.updateProgress(job.documentId, 10, "Extracting text...");
        result.extractedText = await this.extractText(job);
      }

      // Step 2: Perform OCR if enabled
      if (job.config.performOCR) {
        await this.updateProgress(job.documentId, 30, "Performing OCR...");
        result.ocrText = await this.performOCR(job);
      }

      // Step 3: Extract keywords if enabled
      if (job.config.extractKeywords) {
        await this.updateProgress(job.documentId, 50, "Extracting keywords...");
        result.keywords = await this.extractKeywords(job, result.extractedText);
      }

      // Step 4: Generate summary if enabled
      if (job.config.generateSummary) {
        await this.updateProgress(job.documentId, 70, "Generating summary...");
        result.summary = await this.generateSummary(job, result.extractedText);
      }

      // Step 5: Detect language if enabled
      if (job.config.detectLanguage) {
        await this.updateProgress(job.documentId, 85, "Detecting language...");
        result.language = await this.detectLanguage(result.extractedText);
      }

      // Step 6: Enable search indexing if enabled
      if (job.config.enableSearch) {
        await this.updateProgress(job.documentId, 95, "Indexing for search...");
        await this.indexForSearch(job, result);
      }

      await this.updateProgress(job.documentId, 100, "Processing completed");

      result.success = true;
      result.processingTime = Date.now() - startTime;

      this.logger.log(
        `Processing completed for document ${job.documentId} in ${result.processingTime}ms`
      );

      // Send callback to main backend
      await this.sendProcessingCallback(job.documentId, result);

      return result;
    } catch (error) {
      result.success = false;
      result.errors = [error.message];
      result.processingTime = Date.now() - startTime;

      this.logger.error(
        `Processing failed for document ${job.documentId}:`,
        error
      );

      // Send failure callback to main backend
      await this.sendProcessingCallback(job.documentId, result);

      return result;
    }
  }

  private async extractText(job: DocumentProcessingJob): Promise<string> {
    // Simulate text extraction based on file type
    await this.delay(1000); // Simulate processing time

    switch (job.fileType.toLowerCase()) {
      case "pdf":
        return `Extracted text from PDF: ${job.fileName}. This is sample extracted text content.`;
      case "docx":
      case "doc":
        return `Extracted text from Word document: ${job.fileName}. This is sample extracted text content.`;
      case "txt":
        return `Text file content: ${job.fileName}. This is sample text file content.`;
      default:
        return `Generic text extraction from ${job.fileName}. This is sample extracted content.`;
    }
  }

  private async performOCR(job: DocumentProcessingJob): Promise<string> {
    // Simulate OCR processing
    await this.delay(2000); // Simulate longer processing time for OCR

    if (
      ["jpg", "jpeg", "png", "tiff", "bmp"].includes(job.fileType.toLowerCase())
    ) {
      return `OCR text from image ${job.fileName}: This is sample OCR extracted text from the image.`;
    }

    return `OCR processing not applicable for file type: ${job.fileType}`;
  }

  private async extractKeywords(
    job: DocumentProcessingJob,
    text?: string
  ): Promise<string[]> {
    // Simulate keyword extraction
    await this.delay(500);

    if (!text) {
      return ["document", "file", job.fileType];
    }

    // Simple keyword extraction simulation
    const words = text.toLowerCase().split(/\s+/);
    const keywords = [...new Set(words)]
      .filter((word) => word.length > 3)
      .slice(0, 10);

    return keywords.length > 0 ? keywords : ["document", "content", "text"];
  }

  private async generateSummary(
    job: DocumentProcessingJob,
    text?: string
  ): Promise<string> {
    // Simulate summary generation
    await this.delay(1500);

    if (!text) {
      return `Summary for ${job.fileName}: This document contains content that could not be processed for summary generation.`;
    }

    return `Summary for ${job.fileName}: This document contains ${text.length} characters of content. The main topics appear to be related to the document's primary subject matter.`;
  }

  private async detectLanguage(text?: string): Promise<string> {
    // Simulate language detection
    await this.delay(300);

    if (!text) {
      return "unknown";
    }

    // Simple language detection simulation
    const englishWords = ["the", "and", "is", "in", "to", "of", "a", "that"];
    const textLower = text.toLowerCase();
    const englishCount = englishWords.filter((word) =>
      textLower.includes(word)
    ).length;

    return englishCount > 3 ? "en" : "unknown";
  }

  private async indexForSearch(
    job: DocumentProcessingJob,
    result: ProcessingResult
  ): Promise<void> {
    // Simulate search indexing
    await this.delay(800);

    this.logger.log(`Indexed document ${job.documentId} for search`);

    // In a real implementation, this would:
    // 1. Send data to Elasticsearch/OpenSearch
    // 2. Update search index
    // 3. Create searchable metadata
  }

  private async updateProgress(
    documentId: string,
    progress: number,
    step: string
  ): Promise<void> {
    this.logger.log(`Document ${documentId}: ${progress}% - ${step}`);

    // In a real implementation, this would update the job progress in Redis/Queue
    // For now, we'll just log the progress
  }

  private async sendProcessingCallback(
    documentId: string,
    result: ProcessingResult
  ): Promise<void> {
    try {
      const backendUrl = this.configService.get(
        "MAIN_BACKEND_URL",
        "http://localhost:8080"
      );
      const callbackUrl = `${backendUrl}/api/v1/processing/callback`;

      await firstValueFrom(
        this.httpService.post(
          callbackUrl,
          {
            documentId,
            result,
          },
          {
            timeout: 10000,
            headers: {
              "Content-Type": "application/json",
              "X-Service-Token": this.configService.get(
                "SERVICE_TOKEN",
                "processing-service-token"
              ),
            },
          }
        )
      );

      this.logger.log(`Callback sent for document ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send callback for document ${documentId}:`,
        error.message
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
