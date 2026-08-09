import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  async checkRepoAccess(userId: string, repositoryId?: string, owner?: string, repo?: string) {
    let where: any = { userId };
    if (repositoryId) {
      where.id = repositoryId;
    } else if (owner && repo) {
      where.owner = owner;
      where.name = repo;
    } else {
      throw new Error('Must provide either repositoryId or owner/repo');
    }

    const repository = await this.prisma.repository.findFirst({ where });
    if (!repository) {
      throw new NotFoundException('Repository not found or access denied');
    }
    return repository;
  }

  async getLatestScan(userId: string, repositoryId?: string, owner?: string, repo?: string) {
    const repository = await this.checkRepoAccess(userId, repositoryId, owner, repo);
    
    // Find the latest completed analysis job
    const latestAnalysis = await this.prisma.analysisJob.findFirst({
      where: { repositoryId: repository.id, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestAnalysis) return null;

    return this.prisma.securityScan.findUnique({
      where: { analysisJobId: latestAnalysis.id }
    });
  }

  async getScans(userId: string, repositoryId: string) {
    await this.checkRepoAccess(userId, repositoryId);
    
    return this.prisma.securityScan.findMany({
      where: { analysisJob: { repositoryId } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getScanById(userId: string, scanId: string) {
    const scan = await this.prisma.securityScan.findUnique({
      where: { id: scanId },
      include: { analysisJob: true }
    });
    if (!scan) throw new NotFoundException('Scan not found');
    
    await this.checkRepoAccess(userId, scan.analysisJob.repositoryId);
    return scan;
  }

  async getFindings(userId: string, repositoryId: string) {
    const latestScan = await this.getLatestScan(userId, repositoryId);
    if (!latestScan) return [];
    
    return this.prisma.securityFinding.findMany({
      where: { securityScanId: latestScan.id },
      orderBy: { severity: 'asc' }
    });
  }

  async getDependencies(userId: string, repositoryId: string) {
    const latestScan = await this.getLatestScan(userId, repositoryId);
    if (!latestScan) return [];
    
    return this.prisma.dependency.findMany({
      where: { securityScanId: latestScan.id },
      include: { vulnerabilities: true }
    });
  }

  async getVulnerabilities(userId: string, repositoryId: string) {
    const latestScan = await this.getLatestScan(userId, repositoryId);
    if (!latestScan) return [];
    
    return this.prisma.vulnerability.findMany({
      where: { dependency: { securityScanId: latestScan.id } },
      include: { dependency: true },
      orderBy: { severity: 'asc' }
    });
  }

  async getSecrets(userId: string, repositoryId: string) {
    const latestScan = await this.getLatestScan(userId, repositoryId);
    if (!latestScan) return [];
    
    return this.prisma.secretFinding.findMany({
      where: { securityScanId: latestScan.id }
    });
  }

  async getLicenses(userId: string, repositoryId: string) {
    const latestScan = await this.getLatestScan(userId, repositoryId);
    if (!latestScan) return [];
    
    return this.prisma.licenseFinding.findMany({
      where: { securityScanId: latestScan.id }
    });
  }

  async getSummary(userId: string, repositoryId: string) {
    const latestScan = await this.getLatestScan(userId, repositoryId);
    if (!latestScan) return null;

    const vulnerabilities = await this.prisma.vulnerability.findMany({
      where: { dependency: { securityScanId: latestScan.id } }
    });

    const findings = await this.prisma.securityFinding.findMany({
      where: { securityScanId: latestScan.id }
    });

    const secrets = await this.prisma.secretFinding.count({
      where: { securityScanId: latestScan.id }
    });

    return {
      scan: latestScan,
      vulnerabilityCounts: {
        CRITICAL: vulnerabilities.filter((v: any) => v.severity === 'CRITICAL').length,
        HIGH: vulnerabilities.filter((v: any) => v.severity === 'HIGH').length,
        MEDIUM: vulnerabilities.filter((v: any) => v.severity === 'MEDIUM').length,
        LOW: vulnerabilities.filter((v: any) => v.severity === 'LOW').length,
      },
      findingCounts: {
        CRITICAL: findings.filter((f: any) => f.severity === 'CRITICAL').length,
        HIGH: findings.filter((f: any) => f.severity === 'HIGH').length,
        MEDIUM: findings.filter((f: any) => f.severity === 'MEDIUM').length,
        LOW: findings.filter((f: any) => f.severity === 'LOW').length,
      },
      secretsCount: secrets,
      riskScore: latestScan.riskScore
    };
  }
}
