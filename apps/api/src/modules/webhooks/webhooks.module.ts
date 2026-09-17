import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GitHubModule } from '../github/github.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [DatabaseModule, GitHubModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
