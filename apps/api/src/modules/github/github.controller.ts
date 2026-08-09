import { Controller, Get, Delete, Req, Res, UseGuards, Query, Param } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GitHubService } from './github.service';

@Controller('github')
export class GitHubController {
  constructor(
    private readonly githubService: GitHubService,
    private readonly configService: ConfigService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('install-url')
  getInstallUrl(@Req() req: any) {
    const appName = this.configService.get<string>('GITHUB_APP_NAME');
    const state = req.user.id; // pass user id as state if needed, though GitHub App installation might not preserve state properly, we rely on the cookie for auth
    // GitHub Apps use this URL format for new installations
    return {
      url: `https://github.com/apps/${appName}/installations/new?state=${state}`,
    };
  }

  /**
   * The callback URL that GitHub redirects to after installation
   */
  @UseGuards(JwtAuthGuard)
  @Get('setup')
  async setupCallback(
    @Req() req: any,
    @Res() res: Response,
    @Query('installation_id') installationId: string,
    @Query('setup_action') setupAction: string,
    @Query('state') state: string
  ) {
    const userId = req.user.id;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    // CSRF Protection: Validate that the state passed matches the authenticated user
    if (state !== userId) {
      return res.redirect(`${frontendUrl}/settings?github_error=invalid_state`);
    }

    try {
      if (installationId) {
        await this.githubService.handleInstallationCallback(userId, installationId, setupAction);
      }
      res.redirect(`${frontendUrl}/settings?github_connected=true`);
    } catch (error) {
      res.redirect(`${frontendUrl}/settings?github_error=true`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Req() req: any) {
    const integration = await this.githubService.getIntegration(req.user.id);
    return {
      connected: !!integration,
      username: integration?.githubUsername || null,
      updatedAt: integration?.updatedAt || null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect')
  async disconnect(@Req() req: any) {
    return this.githubService.disconnect(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('repositories')
  async getRepositories(@Req() req: any) {
    return this.githubService.getRepositories(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('repositories/:owner/:repo')
  async getRepository(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    return this.githubService.getRepository(req.user.id, owner, repo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('repositories/:owner/:repo/tree')
  async getRepositoryTree(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('branch') branch: string
  ) {
    // Default to main or master if not provided, though the frontend should provide it
    return this.githubService.getRepositoryTree(req.user.id, owner, repo, branch || 'main');
  }

  @UseGuards(JwtAuthGuard)
  @Get('repositories/:owner/:repo/contents')
  async getFileContents(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('path') path: string,
    @Query('branch') branch: string
  ) {
    if (!path) {
      throw new Error('Path is required');
    }
    return this.githubService.getFileContents(req.user.id, owner, repo, path, branch);
  }
}
