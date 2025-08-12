import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProcessingController } from './processing.controller';
import { ProcessingService } from './processing.service';
import { DocumentAnalysisService } from './document-analysis.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    QueueModule,
  ],
  controllers: [ProcessingController],
  providers: [ProcessingService, DocumentAnalysisService],
  exports: [ProcessingService],
})
export class ProcessingModule {}