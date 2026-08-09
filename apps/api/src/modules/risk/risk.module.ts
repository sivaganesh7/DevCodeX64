import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [PrismaModule, RepositoriesModule],
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
