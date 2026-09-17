import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RiskService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async checkAccess(userId: string, repositoryId: string) {
    const repo = await this.prisma.repository.findFirst({
      where: { id: repositoryId, userId },
    });
    if (!repo) {
      throw new UnauthorizedException('Access to repository denied');
    }
    return repo;
  }

  async getRepoRiskOverview(userId: string, analysisId: string) {
    // Verify access to the analysis
    const analysis = await this.prisma.analysisJob.findUnique({
      where: { id: analysisId },
      include: { repository: true },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    await this.checkAccess(userId, analysis.repositoryId);

    // Get all predictions for this analysis
    const predictions = await this.prisma.mLRiskPrediction.findMany({
      where: { analysisId },
    });

    if (predictions.length === 0) {
      return { totalFiles: 0, highRiskFiles: 0, averageRiskProbability: 0, riskLevel: 'LOW' };
    }

    const highRiskFiles = predictions.filter(
      (p: { riskLevel: string }) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
    ).length;

    const totalProb = predictions.reduce((acc: number, curr: { riskProbability: number }) => acc + curr.riskProbability, 0);
    const averageRiskProbability = totalProb / predictions.length;

    let repoRiskLevel = 'LOW';
    const probPercent = averageRiskProbability * 100;
    if (probPercent > 75) repoRiskLevel = 'CRITICAL';
    else if (probPercent > 50) repoRiskLevel = 'HIGH';
    else if (probPercent > 25) repoRiskLevel = 'MEDIUM';

    return {
      totalFiles: predictions.length,
      highRiskFiles,
      averageRiskProbability,
      riskLevel: repoRiskLevel,
    };
  }

  async getRiskFiles(userId: string, analysisId: string) {
    const analysis = await this.prisma.analysisJob.findUnique({
      where: { id: analysisId },
      include: { repository: true },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    await this.checkAccess(userId, analysis.repositoryId);

    const predictions = await this.prisma.mLRiskPrediction.findMany({
      where: { analysisId },
      include: {
        file: {
          select: { path: true, name: true }
        },
        factors: true
      },
      orderBy: { riskProbability: 'desc' }
    });

    return predictions;
  }

  async getRiskFileDetails(userId: string, analysisId: string, fileId: string) {
    const analysis = await this.prisma.analysisJob.findUnique({
      where: { id: analysisId },
      include: { repository: true },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    await this.checkAccess(userId, analysis.repositoryId);

    const prediction = await this.prisma.mLRiskPrediction.findUnique({
      where: {
        analysisId_fileId: { analysisId, fileId }
      },
      include: {
        file: true,
        factors: true
      }
    });

    if (!prediction) {
      throw new NotFoundException('Risk prediction not found for this file');
    }

    return prediction;
  }
}
