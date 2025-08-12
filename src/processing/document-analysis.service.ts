import { Injectable, Logger } from '@nestjs/common';

export interface DocumentAnalysisResult {
  extractedText: string;
  metadata: {
    pageCount: number;
    wordCount: number;
    language: string;
    fileSize: number;
  };
  analysis: {
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
    entities: string[];
    keywords: string[];
  };
}

@Injectable()
export class DocumentAnalysisService {
  private readonly logger = new Logger(DocumentAnalysisService.name);

  async analyzeDocument(
    documentUrl: string,
    fileType: string,
  ): Promise<DocumentAnalysisResult> {
    this.logger.log(`Analyzing document: ${documentUrl}`);

    // Simulate different processing based on file type
    await this.simulateProcessingDelay(fileType);

    // Mock analysis results
    const result: DocumentAnalysisResult = {
      extractedText: this.generateMockText(fileType),
      metadata: {
        pageCount: this.getRandomNumber(1, 50),
        wordCount: this.getRandomNumber(100, 5000),
        language: 'en',
        fileSize: this.getRandomNumber(1024, 10485760), // 1KB to 10MB
      },
      analysis: {
        sentiment: this.getRandomSentiment(),
        topics: this.generateMockTopics(),
        entities: this.generateMockEntities(),
        keywords: this.generateMockKeywords(),
      },
    };

    this.logger.log(`Analysis completed for document: ${documentUrl}`);
    return result;
  }

  private async simulateProcessingDelay(fileType: string): Promise<void> {
    // Different processing times based on file type
    const delays = {
      'application/pdf': 3000,
      'application/msword': 2000,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 2500,
      'text/plain': 500,
      'image/jpeg': 4000,
      'image/png': 4000,
      default: 2000,
    };

    const delay = delays[fileType] || delays.default;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateMockText(fileType: string): string {
    const textSamples = {
      'application/pdf': 'This is extracted text from a PDF document. It contains structured information about business processes, technical specifications, and detailed analysis of various components.',
      'application/msword': 'Document content extracted from Word file. This includes formatted text, headers, and structured content with business requirements and technical documentation.',
      'text/plain': 'Plain text content with simple formatting. Contains raw text data that has been processed and analyzed for key information extraction.',
      default: 'Extracted text content from the uploaded document. This represents the textual information that has been processed and made searchable.',
    };

    return textSamples[fileType] || textSamples.default;
  }

  private getRandomSentiment(): 'positive' | 'negative' | 'neutral' {
    const sentiments = ['positive', 'negative', 'neutral'];
    return sentiments[Math.floor(Math.random() * sentiments.length)] as any;
  }

  private generateMockTopics(): string[] {
    const allTopics = [
      'business', 'technology', 'finance', 'marketing', 'operations',
      'strategy', 'development', 'analysis', 'research', 'planning',
      'management', 'innovation', 'digital transformation', 'automation',
    ];
    
    const count = this.getRandomNumber(2, 5);
    return this.getRandomItems(allTopics, count);
  }

  private generateMockEntities(): string[] {
    const allEntities = [
      'Company A', 'Product B', 'Service C', 'Department D',
      'Project Alpha', 'System Beta', 'Platform Gamma',
      'John Smith', 'Jane Doe', 'Tech Corp', 'Business Unit',
    ];
    
    const count = this.getRandomNumber(1, 4);
    return this.getRandomItems(allEntities, count);
  }

  private generateMockKeywords(): string[] {
    const allKeywords = [
      'implementation', 'optimization', 'integration', 'development',
      'analysis', 'performance', 'security', 'scalability',
      'efficiency', 'automation', 'innovation', 'transformation',
    ];
    
    const count = this.getRandomNumber(3, 6);
    return this.getRandomItems(allKeywords, count);
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}