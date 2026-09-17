import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GitHubService } from '../github/github.service';
import { ReviewFileDto, ReviewPrDto } from './dto/review.dto';

export interface ReviewIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'SECURITY' | 'PERFORMANCE' | 'MAINTAINABILITY' | 'CORRECTNESS' | 'STYLE';
  title: string;
  description: string;
  file: string;
  line: number | null;
  recommendation: string;
}

export interface StructuredReviewOutput {
  summary: string;
  overallRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK' | 'POOR';
  issues: ReviewIssue[];
  positives: string[];
  recommendations: string[];
}

export interface ReviewResultResponse extends StructuredReviewOutput {
  id?: string;
  repositoryId: string;
  reviewType: 'FILE' | 'PR';
  filePath?: string;
  pullRequestNumber?: number;
  createdAt: Date;
}

@Injectable()
export class CodeReviewService {
  private readonly logger = new Logger(CodeReviewService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GitHubService,
  ) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Helper to verify repository ownership / access
   */
  async checkRepoAccess(userId: string, repoIdentifier: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        repoIdentifier,
      );
    let repo = null;

    if (isUuid) {
      repo = await this.prisma.repository.findFirst({
        where: { id: repoIdentifier, userId },
      });
    } else {
      const parts = repoIdentifier.split('/');
      if (parts.length === 2) {
        repo = await this.prisma.repository.findFirst({
          where: { owner: parts[0], name: parts[1], userId },
        });
      } else {
        repo = await this.prisma.repository.findFirst({
          where: { name: repoIdentifier, userId },
        });
      }
    }

    if (!repo) {
      throw new NotFoundException(
        `Repository '${repoIdentifier}' not found or access denied`,
      );
    }

    return repo;
  }

  /**
   * Review a specific repository file
   */
  async reviewFile(
    userId: string,
    repoIdentifier: string,
    dto: ReviewFileDto,
  ): Promise<ReviewResultResponse> {
    const repo = await this.checkRepoAccess(userId, repoIdentifier);

    let content = dto.content;
    let language = dto.language;

    // 1. If content is not provided inline, resolve from RepositoryFile or GitHub
    if (!content) {
      const normalizedPath = dto.filePath.replace(/^\/+/, '');
      const repoFile = await this.prisma.repositoryFile.findFirst({
        where: {
          repositoryId: repo.id,
          path: { in: [dto.filePath, normalizedPath, `/${normalizedPath}`] },
        },
      });

      if (repoFile?.content) {
        content = repoFile.content;
        language = language || repoFile.language || undefined;
      } else {
        // Attempt GitHub fallback if user has integration
        try {
          const ghFile: any = await this.githubService.getFileContents(
            userId,
            repo.owner,
            repo.name,
            dto.filePath,
            dto.branch || repo.defaultBranch,
          );
          if (ghFile && ghFile.content) {
            content = Buffer.from(ghFile.content, 'base64').toString('utf-8');
          }
        } catch (ghErr) {
          this.logger.debug(`Could not retrieve file from GitHub: ${ghErr}`);
        }
      }
    }

    if (!content) {
      throw new NotFoundException(
        `File '${dto.filePath}' not found in repository. Please ensure the repository files are indexed or pass content inline.`,
      );
    }

    // 2. Gather Security and Risk context for enhanced AI reasoning
    const securityContext: any[] = [];
    const riskContext: any[] = [];

    try {
      const latestAnalysis = await this.prisma.analysisJob.findFirst({
        where: { repositoryId: repo.id, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: {
          securityScan: {
            include: {
              securityFindings: {
                where: { filePath: dto.filePath },
                take: 5,
              },
            },
          },
          riskPredictions: {
            where: { file: { path: dto.filePath } },
            take: 1,
          },
        },
      });

      if (latestAnalysis?.securityScan?.securityFindings) {
        for (const finding of latestAnalysis.securityScan.securityFindings) {
          securityContext.push({
            title: finding.title,
            severity: finding.severity,
            file: finding.filePath,
            line: finding.lineNumber,
          });
        }
      }

      if (latestAnalysis?.riskPredictions) {
        for (const r of latestAnalysis.riskPredictions) {
          riskContext.push({
            riskLevel: r.riskLevel,
            score: r.riskProbability,
          });
        }
      }
    } catch (ctxErr) {
      this.logger.warn(`Failed to collect security/risk context for review: ${ctxErr}`);
    }

    // 3. Execute review via AI Service
    let reviewOutput: StructuredReviewOutput;

    try {
      const resp = await fetch(`${this.aiServiceUrl}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewType: 'FILE',
          filePath: dto.filePath,
          language,
          content,
          securityContext,
          riskContext,
        }),
      });

      if (!resp.ok) {
        throw new Error(`AI service responded with HTTP status ${resp.status}`);
      }

      reviewOutput = (await resp.json()) as StructuredReviewOutput;
    } catch (err: any) {
      this.logger.warn(`AI Service review failed (${err.message}). Using local rule engine fallback.`);
      reviewOutput = this.runLocalHeuristicReview(content, dto.filePath, 'FILE');
    }

    // 4. Save review in database
    const savedReview = await this.prisma.codeReview.create({
      data: {
        repositoryId: repo.id,
        userId,
        filePath: dto.filePath,
        reviewType: 'FILE',
        summary: reviewOutput.summary,
        overallRating: reviewOutput.overallRating,
        issuesCount: reviewOutput.issues.length,
        reviewData: reviewOutput as any,
      },
    });

    return {
      id: savedReview.id,
      repositoryId: repo.id,
      reviewType: 'FILE',
      filePath: dto.filePath,
      summary: reviewOutput.summary,
      overallRating: reviewOutput.overallRating,
      issues: reviewOutput.issues,
      positives: reviewOutput.positives,
      recommendations: reviewOutput.recommendations,
      createdAt: savedReview.createdAt,
    };
  }

  /**
   * Review a pull request diff
   */
  async reviewPr(
    userId: string,
    repoIdentifier: string,
    dto: ReviewPrDto,
  ): Promise<ReviewResultResponse> {
    const repo = await this.checkRepoAccess(userId, repoIdentifier);

    let diffText = dto.diff;
    let prTitle = dto.title;
    let prBody = dto.body;
    let prRecord: any = null;

    // 1. Resolve PR and diff from GitHub if pullRequestNumber provided
    if (dto.pullRequestNumber) {
      try {
        const ghPr: any = await this.githubService.getPullRequest(
          userId,
          repo.owner,
          repo.name,
          dto.pullRequestNumber,
        );

        if (ghPr) {
          prTitle = prTitle || ghPr.title;
          prBody = prBody || ghPr.body;

          // Upsert PullRequest in DB
          prRecord = await this.prisma.pullRequest.upsert({
            where: {
              repositoryId_number: {
                repositoryId: repo.id,
                number: dto.pullRequestNumber,
              },
            },
            update: {
              title: ghPr.title || 'Untitled PR',
              body: ghPr.body || '',
              state: ghPr.state || 'open',
              author: ghPr.user?.login || 'unknown',
              baseBranch: ghPr.base?.ref || 'main',
              headBranch: ghPr.head?.ref || 'feature',
              htmlUrl: ghPr.html_url,
            },
            create: {
              repositoryId: repo.id,
              number: dto.pullRequestNumber,
              githubPrId: ghPr.id,
              title: ghPr.title || 'Untitled PR',
              body: ghPr.body || '',
              state: ghPr.state || 'open',
              author: ghPr.user?.login || 'unknown',
              baseBranch: ghPr.base?.ref || 'main',
              headBranch: ghPr.head?.ref || 'feature',
              htmlUrl: ghPr.html_url,
            },
          });
        }
      } catch (ghPrErr) {
        this.logger.warn(`Could not fetch PR #${dto.pullRequestNumber} from GitHub: ${ghPrErr}`);
      }

      if (!diffText) {
        try {
          const ghDiff = await this.githubService.getPullRequestDiff(
            userId,
            repo.owner,
            repo.name,
            dto.pullRequestNumber,
          );
          if (ghDiff && typeof ghDiff === 'string') {
            diffText = ghDiff;
          }
        } catch (diffErr) {
          this.logger.warn(`Could not fetch PR diff from GitHub: ${diffErr}`);
        }
      }
    }

    if (!diffText) {
      throw new BadRequestException(
        'A unified git diff or valid GitHub pullRequestNumber is required for PR code review.',
      );
    }

    // 2. Query AI Service for PR review
    let reviewOutput: StructuredReviewOutput;

    try {
      const resp = await fetch(`${this.aiServiceUrl}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewType: 'PR',
          diff: diffText,
          pullRequestNumber: dto.pullRequestNumber,
          pullRequestTitle: prTitle,
          pullRequestDescription: prBody,
        }),
      });

      if (!resp.ok) {
        throw new Error(`AI service responded with HTTP status ${resp.status}`);
      }

      reviewOutput = (await resp.json()) as StructuredReviewOutput;
    } catch (err: any) {
      this.logger.warn(`AI Service PR review failed (${err.message}). Using local rule engine fallback.`);
      reviewOutput = this.runLocalHeuristicReview(
        diffText,
        dto.pullRequestNumber ? `PR #${dto.pullRequestNumber}` : 'PR Diff',
        'PR',
      );
    }

    // 3. Save review records in DB
    const savedReview = await this.prisma.codeReview.create({
      data: {
        repositoryId: repo.id,
        userId,
        prNumber: dto.pullRequestNumber,
        reviewType: 'PR',
        summary: reviewOutput.summary,
        overallRating: reviewOutput.overallRating,
        issuesCount: reviewOutput.issues.length,
        reviewData: reviewOutput as any,
      },
    });

    if (prRecord) {
      const secIssues = reviewOutput.issues.filter((i) => i.category === 'SECURITY').length;
      await this.prisma.pullRequestReview.create({
        data: {
          pullRequestId: prRecord.id,
          summary: reviewOutput.summary,
          riskLevel:
            reviewOutput.overallRating === 'POOR'
              ? 'CRITICAL'
              : reviewOutput.overallRating === 'NEEDS_WORK'
              ? 'HIGH'
              : 'LOW',
          issuesFound: reviewOutput.issues.length,
          securityIssues: secIssues,
          reviewData: reviewOutput as any,
        },
      });
    }

    return {
      id: savedReview.id,
      repositoryId: repo.id,
      reviewType: 'PR',
      pullRequestNumber: dto.pullRequestNumber,
      summary: reviewOutput.summary,
      overallRating: reviewOutput.overallRating,
      issues: reviewOutput.issues,
      positives: reviewOutput.positives,
      recommendations: reviewOutput.recommendations,
      createdAt: savedReview.createdAt,
    };
  }

  /**
   * Retrieve review history for a repository
   */
  async getReviews(userId: string, repoIdentifier: string, limit = 20) {
    const repo = await this.checkRepoAccess(userId, repoIdentifier);

    return this.prisma.codeReview.findMany({
      where: { repositoryId: repo.id, userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get specific review by ID
   */
  async getReviewById(userId: string, repoIdentifier: string, reviewId: string) {
    const repo = await this.checkRepoAccess(userId, repoIdentifier);

    const review = await this.prisma.codeReview.findFirst({
      where: { id: reviewId, repositoryId: repo.id, userId },
    });

    if (!review) {
      throw new NotFoundException(`Code review with ID '${reviewId}' not found.`);
    }

    return review;
  }

  /**
   * Fallback heuristic rule engine to guarantee schema validation
   */
  private runLocalHeuristicReview(
    content: string,
    targetName: string,
    type: 'FILE' | 'PR',
  ): StructuredReviewOutput {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((rawLine, index) => {
      const lineNum = index + 1;
      const line = rawLine.trim();

      // Detect hardcoded secrets
      if (/(api_?key|secret|password|token)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{12,}['"]/i.test(line)) {
        issues.push({
          severity: 'CRITICAL',
          category: 'SECURITY',
          title: 'Potential hardcoded credential or token detected',
          description: `Line ${lineNum} matches an assignment pattern containing sensitive keys.`,
          file: targetName,
          line: lineNum,
          recommendation: 'Move sensitive credentials to secure environment variables or vault.',
        });
      }

      // Detect loose types in TS
      if (/:\s*any\b/.test(line)) {
        issues.push({
          severity: 'LOW',
          category: 'MAINTAINABILITY',
          title: 'Loose type annotation with `any`',
          description: `Line ${lineNum} uses 'any', bypassing TypeScript type guarantees.`,
          file: targetName,
          line: lineNum,
          recommendation: 'Replace `any` with a specific interface, generic, or `unknown`.',
        });
      }

      // Empty catch
      if (/catch\s*\(\s*(err|error|e)?\s*\)\s*\{\s*\}/.test(line)) {
        issues.push({
          severity: 'MEDIUM',
          category: 'CORRECTNESS',
          title: 'Unhandled or swallowed exception',
          description: `Empty catch block on line ${lineNum} conceals runtime failures.`,
          file: targetName,
          line: lineNum,
          recommendation: 'Log the error or trigger fallback error handling.',
        });
      }
    });

    const positives = [
      'Modular code layout and readable function signatures.',
      'Appropriate separation of concerns in target changes.',
    ];

    const recommendations = [
      'Ensure test coverage covers error paths and boundary conditions.',
      'Check adherence to monorepo linter and formatting guidelines.',
    ];

    let overallRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK' | 'POOR' = 'EXCELLENT';
    if (issues.some((i) => i.severity === 'CRITICAL')) {
      overallRating = 'POOR';
    } else if (issues.some((i) => i.severity === 'HIGH' || i.severity === 'MEDIUM')) {
      overallRating = 'NEEDS_WORK';
    } else if (issues.length > 0) {
      overallRating = 'GOOD';
    }

    return {
      summary: `Automated code review completed for ${targetName}. Identified ${issues.length} potential findings.`,
      overallRating,
      issues,
      positives,
      recommendations,
    };
  }
}
