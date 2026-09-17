import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GitHubModule } from '../github/github.module';
import { CodeReviewController } from './code-review.controller';
import { CodeReviewService } from './code-review.service';

@Module({
  imports: [DatabaseModule, GitHubModule],
  controllers: [CodeReviewController],
  providers: [CodeReviewService],
  exports: [CodeReviewService],
})
export class CodeReviewModule {}
