import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../github/github.service', () => ({
  GitHubService: jest.fn().mockImplementation(() => ({
    listWorkflows: jest.fn(),
    listWorkflowRuns: jest.fn(),
    getWorkflowRun: jest.fn(),
    listJobsForWorkflowRun: jest.fn(),
    reRunWorkflow: jest.fn(),
    cancelWorkflowRun: jest.fn(),
  })),
}));

import { CiCdService } from './ci-cd.service';
import { PrismaService } from '../../database/prisma.service';
import { GitHubService } from '../github/github.service';

describe('CiCdService', () => {
  let service: CiCdService;
  let githubService: any;

  const mockPrisma = {
    repository: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'repo-uuid-1',
        owner: 'testowner',
        name: 'testrepo',
        fullName: 'testowner/testrepo',
      }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CiCdService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: GitHubService,
          useValue: {
            listWorkflows: jest.fn(),
            listWorkflowRuns: jest.fn(),
            getWorkflowRun: jest.fn(),
            listJobsForWorkflowRun: jest.fn(),
            reRunWorkflow: jest.fn(),
            cancelWorkflowRun: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CiCdService>(CiCdService);
    githubService = module.get<GitHubService>(GitHubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWorkflows', () => {
    it('should return GitHub workflows if available', async () => {
      const mockWfs = [
        { id: 1, name: 'CI', path: '.github/workflows/ci.yml', state: 'active' },
      ];
      githubService.listWorkflows.mockResolvedValue(mockWfs);

      const res = await service.getWorkflows('testowner', 'testrepo', 'user-1');
      expect(res).toEqual(mockWfs);
    });

    it('should return fallback workflows if GitHub call fails or is empty', async () => {
      githubService.listWorkflows.mockRejectedValue(new Error('GitHub error'));

      const res = await service.getWorkflows('testowner', 'testrepo', 'user-1');
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].name).toBe('CI - Build & Test');
    });
  });

  describe('getWorkflowRuns', () => {
    it('should return telemetry fallback runs when GitHub is not connected', async () => {
      const res = await service.getWorkflowRuns('testowner', 'testrepo');
      expect(res.runs).toBeDefined();
      expect(res.runs.length).toBeGreaterThan(0);
      expect(res.totalCount).toBeGreaterThan(0);
    });

    it('should filter runs by status', async () => {
      const res = await service.getWorkflowRuns('testowner', 'testrepo', undefined, {
        status: 'success',
      });
      res.runs.forEach((r) => {
        expect(r.conclusion === 'success' || r.status === 'success').toBe(true);
      });
    });
  });

  describe('getWorkflowRun', () => {
    it('should return run detail with jobs and steps', async () => {
      const res = await service.getWorkflowRun('testowner', 9002, 'testrepo');
      expect(res.id).toBe(9002);
      expect(res.jobs).toBeDefined();
      expect(res.jobs.length).toBeGreaterThan(0);
      expect(res.jobs[0].steps).toBeDefined();
    });
  });

  describe('getPipelineHealth', () => {
    it('should compute health metrics accurately', async () => {
      const health = await service.getPipelineHealth('testowner', 'testrepo');
      expect(health.totalRuns).toBeGreaterThan(0);
      expect(health.successRate).toBeGreaterThanOrEqual(0);
      expect(health.successRate).toBeLessThanOrEqual(100);
      expect(['HEALTHY', 'DEGRADED', 'CRITICAL']).toContain(health.healthStatus);
      expect(health.averageDurationSeconds).toBeGreaterThan(0);
      expect(health.activeWorkflowsCount).toBeGreaterThan(0);
    });
  });

  describe('getFailureTrends', () => {
    it('should calculate failure trends, daily distribution, and top failing workflows', async () => {
      const trends = await service.getFailureTrends('testowner', 'testrepo');
      expect(trends.dailyTrends).toBeDefined();
      expect(trends.dailyTrends.length).toBe(7);
      expect(trends.topFailingWorkflows).toBeDefined();
      expect(trends.failureByTrigger).toBeDefined();
      expect(trends.commonFailedSteps.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeRunFailure', () => {
    it('should provide structured AI failure diagnosis for failed run', async () => {
      const diagnosis = await service.analyzeRunFailure('testowner', 9002, 'testrepo');
      expect(diagnosis.runId).toBe(9002);
      expect(diagnosis.rootCauseCategory).toBeDefined();
      expect(diagnosis.summary).toBeDefined();
      expect(diagnosis.diagnosis).toBeDefined();
      expect(diagnosis.recommendedFix).toBeDefined();
      expect(diagnosis.suggestedCommands.length).toBeGreaterThan(0);
    });
  });

  describe('reRunWorkflow', () => {
    it('should queue workflow re-run', async () => {
      const res = await service.reRunWorkflow('testowner', 9001, 'testrepo');
      expect(res.runId).toBe(9001);
      expect(res.status).toBe('queued');
    });
  });
});
