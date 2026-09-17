import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GitHubModule } from '../github/github.module';
import { PullRequestsController } from './pull-requests.controller';
import { PullRequestsService } from './pull-requests.service';

@Module({
  imports: [DatabaseModule, GitHubModule],
  controllers: [PullRequestsController],
  providers: [PullRequestsService],
  exports: [PullRequestsService],
})
export class PullRequestsModule {}
