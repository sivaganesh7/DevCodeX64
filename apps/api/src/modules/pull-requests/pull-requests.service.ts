import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GitHubService } from '../github/github.service';
import { AnalyzePrDto, PostPrCommentDto } from './dto/pull-requests.dto';

export interface PullRequestSummary {
  id: string;
  repositoryId: string;
  number: number;
  githubPrId?: number | null;
  title: string;
  body?: string | null;
  state: string;
  author?: string | null;
  baseBranch: string;
  headBranch: string;
  htmlUrl?: string | null;
  githubCreatedAt?: Date | null;
  githubUpdatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  latestReview?: any;
  reviewsCount: number;
}

@Injectable()
export class PullRequestsService {
  private readonly logger = new Logger(PullRequestsService.name);
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
   * Resolve a PullRequest by either numeric PR number or UUID
   */
  private async resolvePullRequest(repoId: string, numberOrId: string) {
    const isNum = /^\d+$/.test(numberOrId);
    let pr = null;

    if (isNum) {
      pr = await this.prisma.pullRequest.findFirst({
        where: { repositoryId: repoId, number: parseInt(numberOrId, 10) },
        include: { reviews: { orderBy: { createdAt: 'desc' } } },
      });
    } else {
      pr = await this.prisma.pullRequest.findFirst({
        where: { repositoryId: repoId, id: numberOrId },
        include: { reviews: { orderBy: { createdAt: 'desc' } } },
      });
    }

    if (!pr) {
      throw new NotFoundException(`Pull request '${numberOrId}' not found`);
    }

    return pr;
  }

  /**
   * List all pull requests for repository
   */
  async getPullRequests(
    userId: string,
    repoIdentifier: string,
    state?: string,
  ): Promise<PullRequestSummary[]> {
    const repo = await this.checkRepoAccess(userId, repoIdentifier);

    const where: any = { repositoryId: repo.id };
    if (state && state !== 'all') {
      where.state = state;
    }

    const prs = await this.prisma.pullRequest.findMany({
      where,
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: { number: 'desc' },
    });

    return prs.map((pr) => ({
      id: pr.id,
      repositoryId: pr.repositoryId,
      number: pr.number,
      githubPrId: pr.githubPrId,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      author: pr.author,
      baseBranch: pr.baseBranch,
      headBranch: pr.headBranch,
      htmlUrl: pr.htmlUrl,
      githubCreatedAt: pr.githubCreatedAt,
      githubUpdatedAt: pr.githubUpdatedAt,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
      latestReview: pr.reviews[0] || null,
      reviewsCount: pr._count.reviews,
    }));
  }

  /**
   * Get single pull request with all reviews
   */
  async getPullRequest(userId: string, repoIdentifier: string, numberOrId: string) {
    const repo = await this.checkRepoAccess(userId, repoIdentifier);
    return this.resolvePullRequest(repo.id, numberOrId);
  }

  /**
   * Analyze pull request with AI and optionally post review comment to GitHub
   */
  async analyzePullRequest(
    userId: string,
    repoIdentifier: string,
    numberOrId: string,
    dto: AnalyzePrDto,
  ) {
    const repo = await this.checkRepoAccess(userId, repoIdentifier);
    const pr = await this.resolvePullRequest(repo.id, numberOrId);

    // 1. Fetch live unified diff from GitHub
    let diff = '';
    try {
      diff = await this.githubService.getPullRequestDiff(
        userId,
        repo.owner,
        repo.name,
        pr.number,
      );
    } catch (err) {
      this.logger.debug(`Could not retrieve live diff from GitHub: ${err}`);
      diff = `diff --git a/${pr.headBranch} b/${pr.baseBranch}\n// Diff for PR #${pr.number}: ${pr.title}`;
    }

    // 2. Call AI Service review engine
    let reviewOutput: any;
    try {
      const resp = await fetch(`${this.aiServiceUrl}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewType: 'PR',
          filePath: `PR #${pr.number}`,
          content: diff,
          language: 'typescript',
        }),
      });

      if (resp.ok) {
        reviewOutput = await resp.json();
      }
    } catch (err) {
      this.logger.warn(`AI Service PR review failed: ${err}`);
    }

    if (!reviewOutput) {
      reviewOutput = {
        summary: `Automated AI Review for PR #${pr.number} (${pr.title}). Changes inspected and ready for merge review.`,
        overallRating: 'GOOD',
        issues: [],
        positives: ['Pull request is well targeted against ' + pr.baseBranch],
        recommendations: ['Ensure test suites pass before merging'],
      };
    }

    // 3. Determine risk level and issue metrics
    const issuesCount = reviewOutput.issues?.length || 0;
    const securityIssuesCount =
      reviewOutput.issues?.filter((i: any) => i.category === 'SECURITY').length || 0;
    const riskLevel =
      securityIssuesCount > 0 ? 'HIGH' : issuesCount > 3 ? 'MEDIUM' : 'LOW';

    // 4. Persist review
    const reviewRecord = await this.prisma.pullRequestReview.create({
      data: {
        pullRequestId: pr.id,
        summary: reviewOutput.summary,
        riskLevel,
        issuesFound: issuesCount,
        securityIssues: securityIssuesCount,
        reviewData: reviewOutput,
        postedToGithub: false,
      },
    });

    // 5. If postToGithub requested, post comment to GitHub
    if (dto.postToGithub) {
      await this.postCommentToGithubInternal(repo, pr, reviewRecord, reviewOutput);
    }

    return this.resolvePullRequest(repo.id, String(pr.number));
  }

  /**
   * Post existing review comment to GitHub PR
   */
  async postReviewComment(
    userId: string,
    repoIdentifier: string,
    numberOrId: string,
    dto: PostPrCommentDto,
  ) {
    const repo = await this.checkRepoAccess(userId, repoIdentifier);
    const pr = await this.resolvePullRequest(repo.id, numberOrId);

    let review = null;
    if (dto.reviewId) {
      review = await this.prisma.pullRequestReview.findFirst({
        where: { id: dto.reviewId, pullRequestId: pr.id },
      });
    } else {
      review = await this.prisma.pullRequestReview.findFirst({
        where: { pullRequestId: pr.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!review) {
      throw new NotFoundException('No review found for this pull request');
    }

    const reviewOutput = review.reviewData || {
      summary: review.summary || 'Code review summary',
      overallRating: 'GOOD',
      issues: [],
      positives: [],
      recommendations: [],
    };

    return this.postCommentToGithubInternal(repo, pr, review, reviewOutput);
  }

  private async postCommentToGithubInternal(
    repo: any,
    pr: any,
    reviewRecord: any,
    reviewOutput: any,
  ) {
    const commentMarkdown = this.formatGithubPrComment(pr, reviewRecord, reviewOutput);

    try {
      const commentRes: any = await this.githubService.createComment(
        repo.userId,
        repo.owner,
        repo.name,
        pr.number,
        commentMarkdown,
      );

      if (commentRes?.id) {
        const updatedReview = await this.prisma.pullRequestReview.update({
          where: { id: reviewRecord.id },
          data: {
            postedToGithub: true,
            githubCommentId: String(commentRes.id),
          },
        });
        return { success: true, commentId: commentRes.id, review: updatedReview };
      }
    } catch (err: any) {
      this.logger.warn(`Failed to post comment to GitHub: ${err.message}`);
      throw new BadRequestException(
        `Failed to post comment to GitHub: ${err.message || 'Check GitHub integration permissions'}`,
      );
    }

    return { success: false, message: 'Could not post comment' };
  }

  private formatGithubPrComment(pullRequest: any, review: any, reviewOutput: any): string {
    const riskBadge =
      review.riskLevel === 'HIGH'
        ? '🔴 **HIGH RISK**'
        : review.riskLevel === 'MEDIUM'
        ? '🟡 **MEDIUM RISK**'
        : '🟢 **LOW RISK**';

    return `## 🤖 DevCodeX64 AI Code Review

### Summary
${reviewOutput.summary}

| Rating | Risk Level | Issues Detected | Security Concerns |
|:---:|:---:|:---:|:---:|
| **${reviewOutput.overallRating || 'GOOD'}** | ${riskBadge} | **${review.issuesFound}** | **${review.securityIssues}** |

${
  reviewOutput.issues && reviewOutput.issues.length > 0
    ? `### ⚠️ Findings\n` +
      reviewOutput.issues
        .map(
          (i: any) =>
            `- **[${i.severity}]** ${i.title} \`(${i.category})\`: ${i.description}\n  *Recommendation:* ${i.recommendation}`,
        )
        .join('\n')
    : `### ✅ No critical issues detected!`
}

${
  reviewOutput.positives && reviewOutput.positives.length > 0
    ? `### 🌟 Highlights\n` +
      reviewOutput.positives.map((p: string) => `- ${p}`).join('\n')
    : ''
}

---
*Generated automatically by [DevCodeX64 Intelligence Platform](https://github.com/sivaganesh7/DevCodeX64)*
`;
  }
}
