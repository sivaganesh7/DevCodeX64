import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}

