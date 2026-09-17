import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { GitHubClient } from './github.client';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private prisma = new PrismaClient(); // In a real app, use a dedicated PrismaService, but this matches Phase 1 style

  constructor(
    private readonly githubClient: GitHubClient,
    private readonly configService: ConfigService
  ) {}

  /**
   * Handle the callback after a user installs the GitHub App
   */
  async handleInstallationCallback(userId: string, installationId: string, setupAction: string) {
    if (setupAction !== 'install' && setupAction !== 'update') {
      this.logger.log(`Ignoring setup action: ${setupAction}`);
      return;
    }

    try {
      // Fetch installation details using our GitHub App client
      const octokit = await this.githubClient.getInstallationOctokit(installationId);
      
      // Get the user/org account info that the app was installed on
      const response = await octokit.rest.apps.getInstallation({
        installation_id: parseInt(installationId, 10),
      });
      
      const account = response.data.account;
      if (!account || !('login' in account)) {
        throw new Error('Failed to retrieve GitHub account details from installation');
      }

      const githubUserId = account.id.toString();
      const githubUsername = account.login;

      // Upsert the GitHubIntegration record
      const integration = await this.prisma.gitHubIntegration.upsert({
        where: { userId },
        update: {
          installationId,
          githubUserId,
          githubUsername,
        },
        create: {
          userId,
          installationId,
          githubUserId,
          githubUsername,
        },
      });

      this.logger.log(`Successfully linked GitHub installation ${installationId} to user ${userId}`);
      return integration;
    } catch (error) {
      this.logger.error(`Error linking GitHub installation for user ${userId}`, error);
      throw error;
    }
  }

  async getIntegration(userId: string) {
    return this.prisma.gitHubIntegration.findUnique({
      where: { userId },
    });
  }

  async disconnect(userId: string) {
    try {
      const integration = await this.getIntegration(userId);
      if (!integration) {
        throw new NotFoundException('GitHub integration not found');
      }

      await this.prisma.gitHubIntegration.delete({
        where: { userId },
      });

      this.logger.log(`Disconnected GitHub for user ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error disconnecting GitHub for user ${userId}`, error);
      throw error;
    }
  }

  async getRepositories(userId: string) {
    const integration = await this.getIntegration(userId);
    if (!integration) {
      throw new NotFoundException('GitHub integration not found');
    }

    return this.githubClient.getInstallationRepositories(integration.installationId);
  }

  async getRepository(userId: string, owner: string, repo: string) {
    const integration = await this.getIntegration(userId);
    if (!integration) {
      throw new NotFoundException('GitHub integration not found');
    }

    return this.githubClient.getRepository(integration.installationId, owner, repo);
  }

  async getRepositoryTree(userId: string, owner: string, repo: string, branch: string) {
    const integration = await this.getIntegration(userId);
    if (!integration) {
      throw new NotFoundException('GitHub integration not found');
    }

    return this.githubClient.getRepositoryTree(integration.installationId, owner, repo, branch);
  }

  async getFileContents(userId: string, owner: string, repo: string, path: string, branch?: string) {
    const integration = await this.getIntegration(userId);
    if (!integration) {
      throw new NotFoundException('GitHub integration not found');
    }

    return this.githubClient.getFileContents(integration.installationId, owner, repo, path, branch);
  }

  async getPullRequest(userId: string, owner: string, repo: string, pullNumber: number) {
    const integration = await this.getIntegration(userId);
    if (!integration) {
      throw new NotFoundException('GitHub integration not found');
    }

    return this.githubClient.getPullRequest(integration.installationId, owner, repo, pullNumber);
  }

  async getPullRequestDiff(userId: string, owner: string, repo: string, pullNumber: number) {
    const integration = await this.getIntegration(userId);
    if (!integration) {
      throw new NotFoundException('GitHub integration not found');
    }

    return this.githubClient.getPullRequestDiff(integration.installationId, owner, repo, pullNumber);
  }

  async createComment(userId: string, owner: string, repo: string, issueNumber: number, body: string) {
    const integration = await this.getIntegration(userId);
    if (!integration) {
      throw new NotFoundException('GitHub integration not found');
    }

    return this.githubClient.createComment(integration.installationId, owner, repo, issueNumber, body);
  }
}
