import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepositoriesService } from '../repositories/repositories.service';

@Injectable()
export class RiskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repositoriesService: RepositoriesService,
  ) {}

  async getRepoRiskOverview(userId: string, analysisId: string) {
    // Verify access to the analysis
    const analysis = await this.prisma.analysisJob.findUnique({
      where: { id: analysisId },
      include: { repository: true },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    // Verify user owns the repo via GitHubIntegration or directly
    await this.repositoriesService.checkAccess(userId, analysis.repositoryId);

    // Get all predictions for this analysis
    const predictions = await this.prisma.mLRiskPrediction.findMany({
      where: { analysisId },
    });

    if (predictions.length === 0) {
      return { totalFiles: 0, highRiskFiles: 0, averageRiskProbability: 0, riskLevel: 'LOW' };
    }

    const highRiskFiles = predictions.filter(
      p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
    ).length;

    const totalProb = predictions.reduce((acc, curr) => acc + curr.riskProbability, 0);
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

    await this.repositoriesService.checkAccess(userId, analysis.repositoryId);

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

    await this.repositoriesService.checkAccess(userId, analysis.repositoryId);

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
