import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../github/github.service', () => ({
  GitHubService: jest.fn().mockImplementation(() => ({})),
}));

import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma.service';
import { GitHubService } from '../github/github.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockRepos = [
    {
      id: 'repo-1',
      name: 'DevCodeX64',
      owner: 'testowner',
      fullName: 'testowner/DevCodeX64',
      isPrivate: false,
      language: 'TypeScript',
      defaultBranch: 'main',
      stars: 35,
      createdAt: new Date('2026-09-01'),
      updatedAt: new Date('2026-09-17'),
      analysisJobs: [
        {
          id: 'job-1',
          status: 'COMPLETED',
          createdAt: new Date('2026-09-17T10:00:00Z'),
          completedAt: new Date('2026-09-17T10:05:00Z'),
          result: {
            healthScore: 92,
            maintainabilityScore: 88,
            complexityScore: 16,
          },
          securityScan: {
            securityFindings: [
              { id: 'v-1', severity: 'HIGH' },
              { id: 'v-2', severity: 'LOW' },
            ],
            secretFindings: [],
          },
        },
      ],
      pullRequests: [
        { id: 'pr-1', number: 101, title: 'feat: new dashboard', state: 'open', headBranch: 'feature/dash' },
      ],
      documentations: [{ id: 'doc-1', docType: 'README', title: 'README spec' }],
      generatedTests: [{ id: 'test-1', targetFile: 'auth.service.ts', framework: 'vitest' }],
    },
  ];

  const mockPrisma = {
    repository: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GitHubService, useValue: {} },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should aggregate multi-repo metrics from Prisma repositories', async () => {
      mockPrisma.repository.findMany.mockResolvedValue(mockRepos);

      const overview = await service.getOverview('user-1');
      expect(overview).toBeDefined();
      expect(overview.summary.totalRepositories).toBe(1);
      expect(overview.summary.overallHealthScore).toBe(92);
      expect(overview.summary.totalVulnerabilities).toBe(2);
      expect(overview.summary.criticalVulnerabilities).toBe(1);
      expect(overview.summary.totalOpenPullRequests).toBe(1);
      expect(overview.repositories.length).toBe(1);
      expect(overview.repositories[0].name).toBe('DevCodeX64');
      expect(overview.repositories[0].ciStatus).toBe('DEGRADED'); // 1 high vuln
      expect(overview.recentActivity.length).toBeGreaterThan(0);
    });

    it('should return realistic fallback overview if database query fails or is empty', async () => {
      mockPrisma.repository.findMany.mockResolvedValue([]);

      const overview = await service.getOverview('user-1');
      expect(overview).toBeDefined();
      expect(overview.summary.totalRepositories).toBeGreaterThan(0);
      expect(overview.repositories.length).toBeGreaterThan(0);
      expect(overview.recentActivity.length).toBeGreaterThan(0);
    });
  });
});
