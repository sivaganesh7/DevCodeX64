import { Controller, Post, Get, Param, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SecurityService } from './security.service';

@Controller('repositories/:owner/:repo/security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('scans')
  async triggerScan(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    // For now, this just triggers the standard analysis job, which now includes security scanning.
    // To cleanly integrate, this could enqueue directly to a security queue if separated.
    throw new Error('Not implemented: use /analysis POST endpoint to trigger the full pipeline');
  }

  @Get('scans')
  async getScans(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    const repository = await this.securityService.checkRepoAccess(req.user.id, undefined, owner, repo);
    return this.securityService.getScans(req.user.id, repository.id);
  }

  @Get('scans/:scanId')
  async getScanById(
    @Req() req: any,
    @Param('scanId') scanId: string
  ) {
    return this.securityService.getScanById(req.user.id, scanId);
  }

  @Get('findings')
  async getFindings(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    const repository = await this.securityService.checkRepoAccess(req.user.id, undefined, owner, repo);
    return this.securityService.getFindings(req.user.id, repository.id);
  }

  @Get('dependencies')
  async getDependencies(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    const repository = await this.securityService.checkRepoAccess(req.user.id, undefined, owner, repo);
    return this.securityService.getDependencies(req.user.id, repository.id);
  }

  @Get('vulnerabilities')
  async getVulnerabilities(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    const repository = await this.securityService.checkRepoAccess(req.user.id, undefined, owner, repo);
    return this.securityService.getVulnerabilities(req.user.id, repository.id);
  }

  @Get('secrets')
  async getSecrets(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    const repository = await this.securityService.checkRepoAccess(req.user.id, undefined, owner, repo);
    return this.securityService.getSecrets(req.user.id, repository.id);
  }

  @Get('licenses')
  async getLicenses(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    const repository = await this.securityService.checkRepoAccess(req.user.id, undefined, owner, repo);
    return this.securityService.getLicenses(req.user.id, repository.id);
  }

  @Get('summary')
  async getSummary(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    const repository = await this.securityService['checkRepoAccess'](req.user.id, undefined, owner, repo);
    const summary = await this.securityService.getSummary(req.user.id, repository.id);
    if (!summary) throw new NotFoundException('No security scan found for this repository');
    return summary;
  }
}
