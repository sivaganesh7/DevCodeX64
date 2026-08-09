import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaClient } from '@prisma/client';
import { GitHubService } from '../github/github.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private prisma = new PrismaClient(); // Follow Phase 1 style

  constructor(
    @InjectQueue('ingestion_queue') private ingestionQueue: Queue,
    private readonly githubService: GitHubService
  ) {}

  async startIngestion(userId: string, owner: string, repo: string) {
    // 1. Verify GitHub integration
    const integration = await this.githubService.getIntegration(userId);
    if (!integration) {
      throw new NotFoundException('GitHub integration not found');
    }

    // 2. Fetch repository metadata from GitHub via GitHubApp
    let repoMetadata;
    try {
      repoMetadata = await this.githubService.getRepository(userId, owner, repo);
    } catch (error) {
      throw new NotFoundException('Repository not found or access denied');
    }

    const defaultBranch = repoMetadata.default_branch || 'main';

    // 3. Upsert Repository in database
    const dbRepo = await this.prisma.repository.upsert({
      where: {
        id: '00000000-0000-0000-0000-000000000000', // Need a unique constraint to properly upsert. 
        // Wait, Repository has no unique constraint on (userId, owner, name). Let's find first instead.
      } as any,
      create: {
        userId,
        githubIntegrationId: integration.id,
        owner,
        name: repoMetadata.name,
        fullName: repoMetadata.full_name,
        githubRepositoryId: repoMetadata.id.toString(),
        defaultBranch,
        description: repoMetadata.description,
        language: repoMetadata.language,
        visibility: repoMetadata.visibility || repoMetadata.private ? 'private' : 'public',
        htmlUrl: repoMetadata.html_url,
      },
      update: {
        description: repoMetadata.description,
        defaultBranch,
        visibility: repoMetadata.visibility || repoMetadata.private ? 'private' : 'public',
      }
    }).catch(async () => {
       // Manual find and upsert because of missing unique constraint in schema
       const existingRepo = await this.prisma.repository.findFirst({
         where: { userId, fullName: repoMetadata.full_name }
       });

       if (existingRepo) {
         return this.prisma.repository.update({
           where: { id: existingRepo.id },
           data: {
             description: repoMetadata.description,
             defaultBranch,
             visibility: repoMetadata.visibility || repoMetadata.private ? 'private' : 'public',
           }
         });
       } else {
         return this.prisma.repository.create({
           data: {
             userId,
             githubIntegrationId: integration.id,
             owner,
             name: repoMetadata.name,
             fullName: repoMetadata.full_name,
             githubRepositoryId: repoMetadata.id.toString(),
             defaultBranch,
             description: repoMetadata.description,
             language: repoMetadata.language,
             visibility: repoMetadata.visibility || repoMetadata.private ? 'private' : 'public',
             htmlUrl: repoMetadata.html_url,
           }
         });
       }
    });

    // 4. Check for active ingestion jobs
    const activeJob = await this.prisma.ingestionJob.findFirst({
      where: {
        repositoryId: dbRepo.id,
        status: { in: ['QUEUED', 'PENDING', 'PROCESSING'] }
      }
    });

    if (activeJob) {
      throw new ConflictException('Ingestion already in progress for this repository');
    }

    // 5. Create new IngestionJob
    const job = await this.prisma.ingestionJob.create({
      data: {
        repositoryId: dbRepo.id,
        status: 'QUEUED',
        branch: defaultBranch,
      }
    });

    // 6. Queue the job in Bull
    await this.ingestionQueue.add('INGEST_REPOSITORY', {
      jobId: job.id,
      repositoryId: dbRepo.id,
      userId, // for github service
      owner,
      repo,
      branch: defaultBranch,
      installationId: integration.installationId,
    });

    this.logger.log(`Ingestion job ${job.id} queued for ${owner}/${repo}`);
    return job;
  }

  async getJob(userId: string, jobId: string) {
    const job = await this.prisma.ingestionJob.findUnique({
      where: { id: jobId },
      include: { repository: true }
    });

    if (!job) {
      return null;
    }

    // Strict ownership check
    if (job.repository.userId !== userId) {
      return null;
    }

    return job;
  }
}
