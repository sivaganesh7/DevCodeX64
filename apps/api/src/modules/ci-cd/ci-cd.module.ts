import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GitHubModule } from '../github/github.module';
import { CiCdController } from './ci-cd.controller';
import { CiCdService } from './ci-cd.service';

@Module({
  imports: [DatabaseModule, GitHubModule],
  controllers: [CiCdController],
  providers: [CiCdService],
  exports: [CiCdService],
})
export class CiCdModule {}
