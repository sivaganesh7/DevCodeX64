import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

jest.mock('../github/github.service', () => ({
  GitHubService: jest.fn().mockImplementation(() => ({
    getPullRequest: jest.fn(),
    getPullRequestDiff: jest.fn(),
    createComment: jest.fn(),
  })),
}));

import { PullRequestsService } from './pull-requests.service';
import { PrismaService } from '../../database/prisma.service';
import { GitHubService } from '../github/github.service';

describe('PullRequestsService', () => {
  let service: PullRequestsService;

  const mockPrisma = {
    repository: {
      findFirst: jest.fn(),
    },
    pullRequest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    pullRequestReview: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockGitHubService = {
    getPullRequest: jest.fn(),
    getPullRequestDiff: jest.fn(),
    createComment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PullRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GitHubService, useValue: mockGitHubService },
      ],
    }).compile();

    service = module.get<PullRequestsService>(PullRequestsService);
    jest.clearAllMocks();
  });

  const mockRepo = {
    id: 'repo-123',
    userId: 'user-123',
    owner: 'octocat',
    name: 'hello-world',
    defaultBranch: 'main',
  };

  const mockPr = {
    id: 'pr-uuid-1',
    repositoryId: 'repo-123',
    number: 42,
    title: 'Feature: User authentication overhaul',
    body: 'Refactors JWT and adds OAuth flow',
    state: 'open',
    author: 'developer',
    baseBranch: 'main',
    headBranch: 'feature/auth',
    htmlUrl: 'https://github.com/octocat/hello-world/pull/42',
    createdAt: new Date(),
    updatedAt: new Date(),
    reviews: [],
  };

  describe('getPullRequests', () => {
    it('should throw NotFoundException if repository does not exist', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(null);

      await expect(
        service.getPullRequests('user-123', 'octocat/nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return list of pull requests with review counts', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.pullRequest.findMany.mockResolvedValue([
        {
          ...mockPr,
          reviews: [
            {
              id: 'rev-1',
              summary: 'Looks solid',
              riskLevel: 'LOW',
              issuesFound: 0,
              securityIssues: 0,
            },
          ],
          _count: { reviews: 1 },
        },
      ]);

      const result = await service.getPullRequests('user-123', 'octocat/hello-world');
      expect(result).toHaveLength(1);
      expect(result[0].number).toBe(42);
      expect(result[0].reviewsCount).toBe(1);
      expect(result[0].latestReview).toBeDefined();
    });
  });

  describe('getPullRequest', () => {
    it('should resolve pull request by numeric number', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.pullRequest.findFirst.mockResolvedValue(mockPr);

      const result = await service.getPullRequest('user-123', 'octocat/hello-world', '42');
      expect(result).toBeDefined();
      expect(result.number).toBe(42);
    });
  });

  describe('analyzePullRequest', () => {
    it('should analyze pull request, create review, and post comment if requested', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.pullRequest.findFirst.mockResolvedValue(mockPr);
      mockGitHubService.getPullRequestDiff.mockResolvedValue(
        'diff --git a/auth.ts b/auth.ts\n+const token = "secret";',
      );

      const createdReview = {
        id: 'rev-123',
        pullRequestId: 'pr-uuid-1',
        summary: 'Review summary',
        riskLevel: 'LOW',
        issuesFound: 0,
        securityIssues: 0,
        reviewData: {
          summary: 'Review summary',
          overallRating: 'GOOD',
          issues: [],
          positives: [],
          recommendations: [],
        },
      };

      mockPrisma.pullRequestReview.create.mockResolvedValue(createdReview);
      mockGitHubService.createComment.mockResolvedValue({ id: 999 });
      mockPrisma.pullRequestReview.update.mockResolvedValue({
        ...createdReview,
        postedToGithub: true,
        githubCommentId: '999',
      });

      const result = await service.analyzePullRequest(
        'user-123',
        'octocat/hello-world',
        '42',
        { postToGithub: true },
      );

      expect(result).toBeDefined();
      expect(mockPrisma.pullRequestReview.create).toHaveBeenCalled();
      expect(mockGitHubService.createComment).toHaveBeenCalled();
    });
  });
});
