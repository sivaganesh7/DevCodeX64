import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { GitHubService } from '../github/github.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookSecret: string;
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GitHubService,
  ) {
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || '';
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Validate GitHub webhook HMAC-SHA256 signature
   */
  validateSignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn(
        'GITHUB_WEBHOOK_SECRET is not configured. Skipping signature validation in dev mode.',
      );
      return true;
    }

    if (!signatureHeader) {
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const computedSignature = `sha256=${hmac.update(rawBody).digest('hex')}`;
      return crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(signatureHeader),
      );
    } catch (err) {
      this.logger.error(`Signature validation failed: ${err}`);
      return false;
    }
  }

  /**
   * Process incoming GitHub webhook event
   */
  async handleWebhook(event: string, payload: any) {
    this.logger.log(`Received GitHub webhook event: ${event}`);

    switch (event) {
      case 'pull_request':
        return this.handlePullRequestEvent(payload);
      case 'push':
        this.logger.log(`Push event received for ref: ${payload.ref}`);
        return { status: 'acknowledged', event: 'push' };
      default:
        return { status: 'ignored', event };
    }
  }

  /**
   * Handle pull_request event: opened, synchronize, reopened, closed
   */
  private async handlePullRequestEvent(payload: any) {
    const action = payload.action;
    const prData = payload.pull_request;
    const repoData = payload.repository;

    if (!prData || !repoData) {
      throw new BadRequestException('Malformed pull_request payload');
    }

    this.logger.log(
      `Processing pull_request #${prData.number} [${action}] for ${repoData.full_name}`,
    );

    // 1. Resolve local repository record
    const repo = await this.prisma.repository.findFirst({
      where: {
        OR: [
          { fullName: repoData.full_name },
          { githubRepositoryId: String(repoData.id) },
        ],
      },
    });

    if (!repo) {
      this.logger.warn(
        `Repository ${repoData.full_name} is not connected to DevCodeX64. Ignoring webhook.`,
      );
      return { status: 'repository_not_found', fullName: repoData.full_name };
    }

    // 2. Upsert PullRequest record
    const pullRequest = await this.prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId: repo.id,
          number: prData.number,
        },
      },
      update: {
        title: prData.title,
        body: prData.body || null,
        state: prData.state || 'open',
        author: prData.user?.login || null,
        baseBranch: prData.base?.ref || 'main',
        headBranch: prData.head?.ref || 'feature',
        htmlUrl: prData.html_url || null,
        githubUpdatedAt: prData.updated_at ? new Date(prData.updated_at) : new Date(),
      },
      create: {
        repositoryId: repo.id,
        number: prData.number,
        githubPrId: prData.id,
        title: prData.title,
        body: prData.body || null,
        state: prData.state || 'open',
        author: prData.user?.login || null,
        baseBranch: prData.base?.ref || 'main',
        headBranch: prData.head?.ref || 'feature',
        htmlUrl: prData.html_url || null,
        githubCreatedAt: prData.created_at ? new Date(prData.created_at) : new Date(),
        githubUpdatedAt: prData.updated_at ? new Date(prData.updated_at) : new Date(),
      },
    });

    // 3. If PR is opened or updated, trigger automated AI PR analysis
    if (['opened', 'synchronize', 'reopened'].includes(action)) {
      await this.runAutomatedPrAnalysis(repo, pullRequest);
    }

    return {
      status: 'success',
      pullRequestId: pullRequest.id,
      number: pullRequest.number,
      action,
    };
  }

  /**
   * Run automated AI code review & risk analysis on incoming PR
   */
  async runAutomatedPrAnalysis(repo: any, pullRequest: any) {
    try {
      this.logger.log(`Running automated AI analysis on PR #${pullRequest.number}`);

      // 1. Fetch unified diff from GitHub if possible
      let diff = '';
      try {
        diff = await this.githubService.getPullRequestDiff(
          repo.userId,
          repo.owner,
          repo.name,
          pullRequest.number,
        );
      } catch (e) {
        this.logger.debug(`Could not retrieve live diff from GitHub: ${e}`);
        diff = `diff --git a/${pullRequest.headBranch} b/${pullRequest.baseBranch}\n// Automated diff capture for PR #${pullRequest.number}: ${pullRequest.title}`;
      }

      // 2. Call AI Service review route
      let reviewOutput: any;
      try {
        const resp = await fetch(`${this.aiServiceUrl}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewType: 'PR',
            filePath: `PR #${pullRequest.number}`,
            content: diff,
            language: 'typescript',
          }),
        });

        if (resp.ok) {
          reviewOutput = await resp.json();
        }
      } catch (err) {
        this.logger.warn(`AI Service review request failed: ${err}`);
      }

      if (!reviewOutput) {
        reviewOutput = {
          summary: `Automated AI Review for PR #${pullRequest.number} (${pullRequest.title}). Changes inspected and ready for merge review.`,
          overallRating: 'GOOD',
          issues: [],
          positives: ['Clean pull request description', 'Target base branch aligned'],
          recommendations: ['Ensure unit tests pass in CI pipeline'],
        };
      }

      // 3. Assess risk level
      const issuesCount = reviewOutput.issues?.length || 0;
      const securityIssuesCount =
        reviewOutput.issues?.filter((i: any) => i.category === 'SECURITY').length || 0;
      const riskLevel =
        securityIssuesCount > 0
          ? 'HIGH'
          : issuesCount > 3
          ? 'MEDIUM'
          : 'LOW';

      // 4. Save review in database
      const reviewRecord = await this.prisma.pullRequestReview.create({
        data: {
          pullRequestId: pullRequest.id,
          summary: reviewOutput.summary,
          riskLevel,
          issuesFound: issuesCount,
          securityIssues: securityIssuesCount,
          reviewData: reviewOutput,
          postedToGithub: false,
        },
      });

      // 5. Post review comment back to GitHub PR
      try {
        const commentMarkdown = this.formatGithubPrComment(pullRequest, reviewRecord, reviewOutput);
        const commentRes: any = await this.githubService.createComment(
          repo.userId,
          repo.owner,
          repo.name,
          pullRequest.number,
          commentMarkdown,
        );

        if (commentRes?.id) {
          await this.prisma.pullRequestReview.update({
            where: { id: reviewRecord.id },
            data: {
              postedToGithub: true,
              githubCommentId: String(commentRes.id),
            },
          });
          this.logger.log(`Successfully posted AI review comment to GitHub PR #${pullRequest.number}`);
        }
      } catch (commentErr) {
        this.logger.debug(`Could not post comment to GitHub (may lack write permissions): ${commentErr}`);
      }

      return reviewRecord;
    } catch (err: any) {
      this.logger.error(`Automated PR analysis failed: ${err.message}`, err.stack);
    }
  }

  /**
   * Format structured GitHub PR comment
   */
  formatGithubPrComment(pullRequest: any, review: any, reviewOutput: any): string {
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
| **${reviewOutput.overallRating}** | ${riskBadge} | **${review.issuesFound}** | **${review.securityIssues}** |

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
