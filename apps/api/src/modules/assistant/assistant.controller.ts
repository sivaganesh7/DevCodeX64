import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AssistantService } from './assistant.service';
import { CreateConversationDto, SendMessageDto } from './dto/assistant.dto';
import { RunAgentTaskDto } from './dto/agent.dto';

@Controller([
  'repositories/:owner/:repo/assistant',
  'repositories/:id/assistant',
])
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  private getRepoIdentifier(params: { owner?: string; repo?: string; id?: string }): string {
    if (params.owner && params.repo) {
      return `${params.owner}/${params.repo}`;
    }
    if (params.id) {
      return params.id;
    }
    throw new Error('Repository identifier not provided');
  }

  @Post('conversations')
  async createConversation(
    @Req() req: any,
    @Param() params: any,
    @Body() dto: CreateConversationDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.assistantService.createConversation(req.user.id, repoIdentifier, dto);
  }

  @Get('conversations')
  async getConversations(
    @Req() req: any,
    @Param() params: any,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.assistantService.getConversations(req.user.id, repoIdentifier);
  }

  @Get('conversations/:convId')
  async getConversation(
    @Req() req: any,
    @Param() params: any,
    @Param('convId') convId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.assistantService.getConversation(req.user.id, repoIdentifier, convId);
  }

  @Delete('conversations/:convId')
  async deleteConversation(
    @Req() req: any,
    @Param() params: any,
    @Param('convId') convId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.assistantService.deleteConversation(req.user.id, repoIdentifier, convId);
  }

  @Post('conversations/:convId/messages')
  async sendMessage(
    @Req() req: any,
    @Param() params: any,
    @Param('convId') convId: string,
    @Body() dto: SendMessageDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.assistantService.sendMessage(req.user.id, repoIdentifier, convId, dto);
  }

  @Post('agent')
  async runAgentTask(
    @Req() req: any,
    @Param() params: any,
    @Body() dto: RunAgentTaskDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.assistantService.runAgentTask(req.user.id, repoIdentifier, dto);
  }

  @Post('index')
  async triggerIndexing(
    @Req() req: any,
    @Param() params: any,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.assistantService.triggerIndexing(req.user.id, repoIdentifier);
  }

  @Get('indexing/status')
  async getIndexingStatus(
    @Req() req: any,
    @Param() params: any,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.assistantService.getIndexingStatus(req.user.id, repoIdentifier);
  }
}
