import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

@Injectable()
export class GitHubClient {
  private readonly logger = new Logger(GitHubClient.name);
  private appOctokit: Octokit;

  constructor(private configService: ConfigService) {
    const appId = this.configService.get<string>('GITHUB_APP_ID');
    const privateKey = this.configService.get<string>('GITHUB_PRIVATE_KEY');

    if (!appId || !privateKey) {
      this.logger.warn('GitHub App credentials missing. GitHub integration will not work.');
      // Provide a dummy octokit if credentials are not configured yet
      this.appOctokit = new Octokit();
      return;
    }

    this.appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey: privateKey.replace(/\\n/g, '\n'), // handle newlines in env variables
      },
    });
  }

  /**
   * Get an Octokit instance authenticated as a specific installation.
   * This is used to make API calls to repositories the user has granted access to.
   */
  async getInstallationOctokit(installationId: number | string): Promise<Octokit> {
    const appId = this.configService.get<string>('GITHUB_APP_ID');
    const privateKey = this.configService.get<string>('GITHUB_PRIVATE_KEY');

    if (!appId || !privateKey) {
      throw new Error('GitHub App credentials are not configured');
    }

    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        installationId,
      },
    });
  }

  /**
   * Retrieve list of repositories accessible to this installation
   */
  async getInstallationRepositories(installationId: string) {
    try {
      const octokit = await this.getInstallationOctokit(installationId);
      // GitHub API returns repositories the installation can access
      const response = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100,
      });
      return response.data.repositories;
    } catch (error) {
      this.logger.error(`Failed to fetch repositories for installation ${installationId}`, error);
      throw error;
    }
  }

  /**
   * Fetch specific repository metadata
   */
  async getRepository(installationId: string, owner: string, repo: string) {
    try {
      const octokit = await this.getInstallationOctokit(installationId);
      const response = await octokit.rest.repos.get({
        owner,
        repo,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch repository ${owner}/${repo}`, error);
      throw error;
    }
  }

  /**
   * Fetch repository file tree
   */
  async getRepositoryTree(installationId: string, owner: string, repo: string, defaultBranch: string) {
    try {
      const octokit = await this.getInstallationOctokit(installationId);
      const response = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: '1',
      });
      return response.data.tree;
    } catch (error) {
      this.logger.error(`Failed to fetch tree for ${owner}/${repo}`, error);
      throw error;
    }
  }
  /**
   * Fetch repository file contents
   */
  async getFileContents(installationId: string, owner: string, repo: string, path: string, branch?: string) {
    try {
      const octokit = await this.getInstallationOctokit(installationId);
      const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch file contents for ${owner}/${repo}/${path}`, error);
      throw error;
    }
  }

  /**
   * Fetch pull request metadata
   */
  async getPullRequest(installationId: string | number, owner: string, repo: string, pullNumber: number) {
    try {
      const octokit = await this.getInstallationOctokit(installationId);
      const response = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch pull request #${pullNumber} for ${owner}/${repo}`, error);
      throw error;
    }
  }

  /**
   * Fetch pull request unified diff
   */
  async getPullRequestDiff(installationId: string | number, owner: string, repo: string, pullNumber: number): Promise<string> {
    try {
      const octokit = await this.getInstallationOctokit(installationId);
      const response = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: {
          format: 'diff',
        },
      });
      return response.data as unknown as string;
    } catch (error) {
      this.logger.error(`Failed to fetch pull request diff for #${pullNumber} in ${owner}/${repo}`, error);
      throw error;
    }
  }
}
