import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { PrismaService } from '../../database/prisma.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'repository_indexing',
    }),
  ],
  controllers: [AssistantController],
  providers: [AssistantService, PrismaService],
  exports: [AssistantService],
})
export class AssistantModule {}
