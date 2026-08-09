import { Module } from '@nestjs/common';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { GitHubClient } from './github.client';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [GitHubController],
  providers: [GitHubService, GitHubClient],
  exports: [GitHubService],
})
export class GitHubModule {}
