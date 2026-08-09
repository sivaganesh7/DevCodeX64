import { Controller, Post, Get, Param, UseGuards, Req, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IngestionService } from './ingestion.service';

@Controller('repositories/:owner/:repo/ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async startIngestion(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    try {
      const job = await this.ingestionService.startIngestion(req.user.id, owner, repo);
      return {
        jobId: job.id,
        status: job.status,
      };
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to start ingestion: ${error.message}`);
    }
  }
}

@Controller('ingestion')
export class IngestionJobController {
  constructor(private readonly ingestionService: IngestionService) {}

  @UseGuards(JwtAuthGuard)
  @Get('job/:jobId')
  async getJobStatus(@Req() req: any, @Param('jobId') jobId: string) {
    const job = await this.ingestionService.getJob(req.user.id, jobId);
    if (!job) {
      throw new NotFoundException('Ingestion job not found');
    }
    return {
      id: job.id,
      status: job.status,
      totalFiles: job.totalFiles,
      processedFiles: job.processedFiles,
      skippedFiles: job.skippedFiles,
      failedFiles: job.failedFiles,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
    };
  }
}
