import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PullRequestsService } from './pull-requests.service';
import { AnalyzePrDto, PostPrCommentDto } from './dto/pull-requests.dto';

@Controller([
  'repositories/:owner/:repo/pull-requests',
  'repositories/:id/pull-requests',
])
@UseGuards(JwtAuthGuard)
export class PullRequestsController {
  constructor(private readonly prService: PullRequestsService) {}

  private getRepoIdentifier(params: { owner?: string; repo?: string; id?: string }): string {
    if (params.owner && params.repo) {
      return `${params.owner}/${params.repo}`;
    }
    if (params.id) {
      return params.id;
    }
    throw new Error('Repository identifier not provided');
  }

  @Get()
  async getPullRequests(
    @Req() req: any,
    @Param() params: any,
    @Query('state') state?: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.prService.getPullRequests(req.user.id, repoIdentifier, state);
  }

  @Get(':numberOrId')
  async getPullRequest(
    @Req() req: any,
    @Param() params: any,
    @Param('numberOrId') numberOrId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.prService.getPullRequest(req.user.id, repoIdentifier, numberOrId);
  }

  @Post(':numberOrId/analyze')
  async analyzePullRequest(
    @Req() req: any,
    @Param() params: any,
    @Param('numberOrId') numberOrId: string,
    @Body() dto: AnalyzePrDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.prService.analyzePullRequest(req.user.id, repoIdentifier, numberOrId, dto);
  }

  @Post(':numberOrId/comment')
  async postReviewComment(
    @Req() req: any,
    @Param() params: any,
    @Param('numberOrId') numberOrId: string,
    @Body() dto: PostPrCommentDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.prService.postReviewComment(req.user.id, repoIdentifier, numberOrId, dto);
  }
}
