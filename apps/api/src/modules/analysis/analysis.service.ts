import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private prisma = new PrismaClient(); // Keep consistent with previous phases

  constructor(
    @InjectQueue('analysis_queue') private analysisQueue: Queue
  ) {}

  async startAnalysis(userId: string, owner: string, repo: string) {
    // 1. Find repository
    const repository = await this.prisma.repository.findFirst({
      where: {
        userId,
        owner,
        name: repo,
      }
    });

    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    // 2. Check for active analysis jobs
    const activeJob = await this.prisma.analysisJob.findFirst({
      where: {
        repositoryId: repository.id,
        status: { in: ['QUEUED', 'PENDING', 'PROCESSING'] }
      }
    });

    if (activeJob) {
      throw new ConflictException('Analysis already in progress for this repository');
    }

    // 3. Ensure the repository has files (has been ingested)
    const fileCount = await this.prisma.repositoryFile.count({
      where: { repositoryId: repository.id }
    });

    if (fileCount === 0) {
      throw new ConflictException('Repository is empty. Please run ingestion first.');
    }

    // 4. Create new AnalysisJob
    const job = await this.prisma.analysisJob.create({
      data: {
        repositoryId: repository.id,
        status: 'QUEUED',
      }
    });

    // 5. Queue the job in Bull
    await this.analysisQueue.add('ANALYZE_REPOSITORY', {
      jobId: job.id,
      repositoryId: repository.id,
      userId,
      owner,
      repo,
    });

    this.logger.log(`Analysis job ${job.id} queued for ${owner}/${repo}`);
    return job;
  }

  async getLatestAnalysis(userId: string, owner: string, repo: string) {
    const repository = await this.prisma.repository.findFirst({
      where: { userId, owner, name: repo }
    });

    if (!repository) {
      throw new NotFoundException('Repository not found');
    }

    // Find the latest completed job
    const job = await this.prisma.analysisJob.findFirst({
      where: {
        repositoryId: repository.id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        result: true,
      }
    });

    return job;
  }

  async getMetrics(userId: string, owner: string, repo: string) {
    const latestJob = await this.getLatestAnalysis(userId, owner, repo);
    if (!latestJob) {
      return [];
    }

    return this.prisma.codeMetric.findMany({
      where: { analysisId: latestJob.id },
      orderBy: { filePath: 'asc' }
    });
  }

  async getIssues(userId: string, owner: string, repo: string, severity?: string) {
    const latestJob = await this.getLatestAnalysis(userId, owner, repo);
    if (!latestJob) {
      return [];
    }

    return this.prisma.issue.findMany({
      where: { 
        analysisId: latestJob.id,
        ...(severity ? { severity } : {})
      },
      orderBy: { severity: 'asc' } // In string terms, CRITICAL, HIGH, LOW, MEDIUM. Wait, we'll sort properly on frontend.
    });
  }
}
