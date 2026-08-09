import { Controller, Post, Get, Param, UseGuards, Req, NotFoundException, ConflictException, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';

@Controller('repositories/:owner/:repo/analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  async startAnalysis(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    try {
      const job = await this.analysisService.startAnalysis(req.user.id, owner, repo);
      return job;
    } catch (error: any) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to start analysis: ${error.message}`);
    }
  }

  @Get('latest')
  async getLatestAnalysis(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    const analysis = await this.analysisService.getLatestAnalysis(req.user.id, owner, repo);
    if (!analysis) {
      throw new NotFoundException('No analysis found for this repository');
    }
    return analysis;
  }

  @Get('metrics')
  async getMetrics(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ) {
    return this.analysisService.getMetrics(req.user.id, owner, repo);
  }

  @Get('issues')
  async getIssues(
    @Req() req: any,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('severity') severity?: string
  ) {
    return this.analysisService.getIssues(req.user.id, owner, repo, severity);
  }
}
