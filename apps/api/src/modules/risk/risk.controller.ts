import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RiskService } from './risk.service';

@Controller('analyses/:analysisId/risk')
@UseGuards(JwtAuthGuard)
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get()
  async getRiskOverview(
    @Req() req: any,
    @Param('analysisId') analysisId: string
  ) {
    return this.riskService.getRepoRiskOverview(req.user.id, analysisId);
  }

  @Get('files')
  async getRiskFiles(
    @Req() req: any,
    @Param('analysisId') analysisId: string
  ) {
    return this.riskService.getRiskFiles(req.user.id, analysisId);
  }

  @Get('files/:fileId')
  async getRiskFileDetails(
    @Req() req: any,
    @Param('analysisId') analysisId: string,
    @Param('fileId') fileId: string
  ) {
    return this.riskService.getRiskFileDetails(req.user.id, analysisId, fileId);
  }
}
