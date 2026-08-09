import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ingestion_queue',
    }),
    ConfigModule,
    GitHubModule,
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
