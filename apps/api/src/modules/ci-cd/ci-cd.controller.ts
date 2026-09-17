import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CiCdService } from './ci-cd.service';
import { WorkflowRunsQueryDto } from './dto/ci-cd.dto';

@Controller([
  'repositories/:owner/:repo/ci-cd',
  'repositories/:id/ci-cd',
])
@UseGuards(JwtAuthGuard)
export class CiCdController {
  constructor(private readonly ciCdService: CiCdService) {}

  private getRepoIdentifier(params: { owner?: string; repo?: string; id?: string }): string {
    if (params.owner && params.repo) {
      return `${params.owner}/${params.repo}`;
    }
    if (params.id) {
      return params.id;
    }
    throw new Error('Repository identifier not provided');
  }

  @Get('workflows')
  async getWorkflows(@Req() req: any, @Param() params: any) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.ciCdService.getWorkflows(repoIdentifier, undefined, req.user.id);
  }

  @Get('runs')
  async getWorkflowRuns(
    @Req() req: any,
    @Param() params: any,
    @Query() query: WorkflowRunsQueryDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.ciCdService.getWorkflowRuns(repoIdentifier, undefined, req.user.id, query);
  }

  @Get('runs/:runId')
  async getWorkflowRun(
    @Req() req: any,
    @Param() params: any,
    @Param('runId') runId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.ciCdService.getWorkflowRun(
      repoIdentifier,
      parseInt(runId, 10),
      undefined,
      req.user.id,
    );
  }

  @Get('health')
  async getPipelineHealth(@Req() req: any, @Param() params: any) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.ciCdService.getPipelineHealth(repoIdentifier, undefined, req.user.id);
  }

  @Get('failure-trends')
  async getFailureTrends(@Req() req: any, @Param() params: any) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.ciCdService.getFailureTrends(repoIdentifier, undefined, req.user.id);
  }

  @Post('runs/:runId/rerun')
  async reRunWorkflow(
    @Req() req: any,
    @Param() params: any,
    @Param('runId') runId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.ciCdService.reRunWorkflow(
      repoIdentifier,
      parseInt(runId, 10),
      undefined,
      req.user.id,
    );
  }

  @Post('runs/:runId/analyze')
  async analyzeRunFailure(
    @Req() req: any,
    @Param() params: any,
    @Param('runId') runId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.ciCdService.analyzeRunFailure(
      repoIdentifier,
      parseInt(runId, 10),
      undefined,
      req.user.id,
    );
  }
}
