import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DocumentProcessorService } from "./services/document-processor.service";
import { QueueConsumerService } from "./services/queue-consumer.service";

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: configService.get("REDIS_PORT", 6379),
          password: configService.get("REDIS_PASSWORD"),
          db: configService.get("REDIS_DB", 0),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: "document-processing",
    }),
  ],
  providers: [DocumentProcessorService, QueueConsumerService],
  exports: [DocumentProcessorService, QueueConsumerService],
})
export class ProcessingModule {}
