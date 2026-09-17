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
import { DocumentationService } from './documentation.service';
import { GenerateDocumentationDto } from './dto/documentation.dto';

@Controller([
  'repositories/:owner/:repo/documentation',
  'repositories/:id/documentation',
])
@UseGuards(JwtAuthGuard)
export class DocumentationController {
  constructor(private readonly docService: DocumentationService) {}

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
  async generateDocumentation(
    @Req() req: any,
    @Param() params: any,
    @Body() dto: GenerateDocumentationDto,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.docService.generateDocumentation(req.user.id, repoIdentifier, dto);
  }

  @Get()
  async getDocumentations(
    @Req() req: any,
    @Param() params: any,
    @Query('docType') docType?: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.docService.getDocumentations(req.user.id, repoIdentifier, docType);
  }

  @Get(':docId')
  async getDocumentationById(
    @Req() req: any,
    @Param() params: any,
    @Param('docId') docId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.docService.getDocumentationById(req.user.id, repoIdentifier, docId);
  }

  @Delete(':docId')
  async deleteDocumentation(
    @Req() req: any,
    @Param() params: any,
    @Param('docId') docId: string,
  ) {
    const repoIdentifier = this.getRepoIdentifier(params);
    return this.docService.deleteDocumentation(req.user.id, repoIdentifier, docId);
  }
}
