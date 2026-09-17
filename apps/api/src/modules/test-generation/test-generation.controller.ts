import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TestGenerationService } from './test-generation.service';
import { GenerateTestDto, ExecuteTestDto } from './dto/test-generation.dto';

@Controller([
  'repositories/:owner/:repo/tests',
  'repositories/:id/tests',
])
@UseGuards(JwtAuthGuard)
export class TestGenerationController {
  constructor(private readonly testService: TestGenerationService) {}

  private getRepoIdentifier(params: { owner?: string; repo?: string; id?: string }): string {
    if (params.owner && params.repo) {
      return `${params.owner}/${params.repo}`;
    }
    if (params.id) {
      return params.id;
    }
    throw new Error('Repository identifier not provided');
  }

  @Post('generate')
  async generateTest(
    @Req() req: any,
    @Param() params: any,
    @Body() dto: GenerateTestDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.testService.generateTest(req.user.id, repoIdentifier, dto);
  }

  @Post(':testId/execute')
  async executeTest(
    @Req() req: any,
    @Param() params: any,
    @Param('testId') testId: string,
    @Body() dto: ExecuteTestDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.testService.executeTest(req.user.id, repoIdentifier, testId, dto);
  }

  @Get()
  async getTests(
    @Req() req: any,
    @Param() params: any,
    @Query('filePath') filePath?: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.testService.getTests(req.user.id, repoIdentifier, filePath);
  }

  @Get(':testId')
  async getTestById(
    @Req() req: any,
    @Param() params: any,
    @Param('testId') testId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.testService.getTestById(req.user.id, repoIdentifier, testId);
  }

  @Delete(':testId')
  async deleteTest(
    @Req() req: any,
    @Param() params: any,
    @Param('testId') testId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.testService.deleteTest(req.user.id, repoIdentifier, testId);
  }
}
