import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CodeReviewService } from './code-review.service';
import { ReviewFileDto, ReviewPrDto } from './dto/review.dto';

@Controller([
  'repositories/:owner/:repo/review',
  'repositories/:id/review',
])
@UseGuards(JwtAuthGuard)
export class CodeReviewController {
  constructor(private readonly codeReviewService: CodeReviewService) {}

  private getRepoIdentifier(params: { owner?: string; repo?: string; id?: string }): string {
    if (params.owner && params.repo) {
      return `${params.owner}/${params.repo}`;
    }
    if (params.id) {
      return params.id;
    }
    throw new Error('Repository identifier not provided');
  }

  @Post('file')
  async reviewFile(
    @Req() req: any,
    @Param() params: any,
    @Body() dto: ReviewFileDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.codeReviewService.reviewFile(req.user.id, repoIdentifier, dto);
  }

  @Post('pr')
  async reviewPr(
    @Req() req: any,
    @Param() params: any,
    @Body() dto: ReviewPrDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.codeReviewService.reviewPr(req.user.id, repoIdentifier, dto);
  }

  @Get()
  async getReviews(
    @Req() req: any,
    @Param() params: any,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.codeReviewService.getReviews(req.user.id, repoIdentifier);
  }

  @Get(':reviewId')
  async getReviewById(
    @Req() req: any,
    @Param() params: any,
    @Param('reviewId') reviewId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.codeReviewService.getReviewById(req.user.id, repoIdentifier, reviewId);
  }
}
