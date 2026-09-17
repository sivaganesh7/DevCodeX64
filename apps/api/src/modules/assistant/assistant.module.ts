import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { DatabaseModule } from '../../database/database.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: 'repository_indexing',
    }),
  ],
  controllers: [AssistantController],
  providers: [AssistantService],
  exports: [AssistantService],
})
export class AssistantModule {}

