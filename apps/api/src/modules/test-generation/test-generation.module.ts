import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GitHubModule } from '../github/github.module';
import { TestGenerationController } from './test-generation.controller';
import { TestGenerationService } from './test-generation.service';

@Module({
  imports: [DatabaseModule, GitHubModule],
  controllers: [TestGenerationController],
  providers: [TestGenerationService],
  exports: [TestGenerationService],
})
export class TestGenerationModule {}
