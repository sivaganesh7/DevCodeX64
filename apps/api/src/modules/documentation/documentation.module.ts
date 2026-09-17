import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GitHubModule } from '../github/github.module';
import { DocumentationController } from './documentation.controller';
import { DocumentationService } from './documentation.service';

@Module({
  imports: [DatabaseModule, GitHubModule],
  controllers: [DocumentationController],
  providers: [DocumentationService],
  exports: [DocumentationService],
})
export class DocumentationModule {}
