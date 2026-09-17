import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../github/github.service', () => ({
  GitHubService: jest.fn().mockImplementation(() => ({
    getFileContents: jest.fn(),
    getPullRequest: jest.fn(),
    getPullRequestDiff: jest.fn(),
  })),
}));

import { CodeReviewService } from './code-review.service';
import { PrismaService } from '../../database/prisma.service';
import { GitHubService } from '../github/github.service';

describe('CodeReviewService', () => {
  let service: CodeReviewService;

  const mockPrisma = {
    repository: {
      findFirst: jest.fn(),
    },
    repositoryFile: {
      findFirst: jest.fn(),
    },
    analysisJob: {
      findFirst: jest.fn(),
    },
    codeReview: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    pullRequest: {
      upsert: jest.fn(),
    },
    pullRequestReview: {
      create: jest.fn(),
    },
  };

  const mockGitHubService = {
    getFileContents: jest.fn(),
    getPullRequest: jest.fn(),
    getPullRequestDiff: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeReviewService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GitHubService, useValue: mockGitHubService },
      ],
    }).compile();

    service = module.get<CodeReviewService>(CodeReviewService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkRepoAccess', () => {
    it('should resolve repository by owner/name', async () => {
      const mockRepo = { id: 'repo-1', owner: 'devcodex', name: 'core', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);

      const res = await service.checkRepoAccess('user-1', 'devcodex/core');
      expect(res).toEqual(mockRepo);
      expect(mockPrisma.repository.findFirst).toHaveBeenCalledWith({
        where: { owner: 'devcodex', name: 'core', userId: 'user-1' },
      });
    });

    it('should throw NotFoundException if repository does not exist', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(null);

      await expect(service.checkRepoAccess('user-1', 'devcodex/missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reviewFile', () => {
    it('should review a file with inline code and save review', async () => {
      const mockRepo = { id: 'repo-1', owner: 'devcodex', name: 'core', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.analysisJob.findFirst.mockResolvedValue(null);

      mockPrisma.codeReview.create.mockImplementation((args) =>
        Promise.resolve({
          id: 'review-123',
          repositoryId: args.data.repositoryId,
          userId: args.data.userId,
          filePath: args.data.filePath,
          reviewType: args.data.reviewType,
          summary: args.data.summary,
          overallRating: args.data.overallRating,
          issuesCount: args.data.issuesCount,
          reviewData: args.data.reviewData,
          createdAt: new Date(),
        }),
      );

      const result = await service.reviewFile('user-1', 'devcodex/core', {
        filePath: 'src/utils/crypto.ts',
        content: `export function hash(data: any) { const secret = "sk-live-1234567890ab"; return data; }`,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('review-123');
      expect(result.filePath).toBe('src/utils/crypto.ts');
      expect(['EXCELLENT', 'GOOD', 'NEEDS_WORK', 'POOR']).toContain(result.overallRating);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(mockPrisma.codeReview.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if file is not found anywhere', async () => {
      const mockRepo = { id: 'repo-1', owner: 'devcodex', name: 'core', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.repositoryFile.findFirst.mockResolvedValue(null);
      mockGitHubService.getFileContents.mockRejectedValue(new Error('Not found'));

      await expect(
        service.reviewFile('user-1', 'devcodex/core', { filePath: 'unknown.ts' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reviewPr', () => {
    it('should review a PR diff and save both CodeReview and PullRequestReview', async () => {
      const mockRepo = { id: 'repo-1', owner: 'devcodex', name: 'core', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.pullRequest.upsert.mockResolvedValue({ id: 'pr-db-1' });
      mockGitHubService.getPullRequest.mockResolvedValue({
        id: 100,
        title: 'Refactor Auth module',
        body: 'Description of changes',
        state: 'open',
        user: { login: 'devuser' },
        base: { ref: 'main' },
        head: { ref: 'auth-refactor' },
        html_url: 'https://github.com/devcodex/core/pull/12',
      });

      mockPrisma.codeReview.create.mockImplementation((args) =>
        Promise.resolve({
          id: 'review-pr-456',
          repositoryId: args.data.repositoryId,
          userId: args.data.userId,
          prNumber: args.data.prNumber,
          reviewType: 'PR',
          summary: args.data.summary,
          overallRating: args.data.overallRating,
          issuesCount: args.data.issuesCount,
          reviewData: args.data.reviewData,
          createdAt: new Date(),
        }),
      );
      mockPrisma.pullRequestReview.create.mockResolvedValue({ id: 'pr-rev-1' });

      const diff = `--- a/src/auth.ts\n+++ b/src/auth.ts\n@@ -1,3 +1,3 @@\n-const a: number = 1;\n+const a: any = 2;`;
      const result = await service.reviewPr('user-1', 'devcodex/core', {
        pullRequestNumber: 12,
        diff,
        title: 'Refactor Auth module',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('review-pr-456');
      expect(result.pullRequestNumber).toBe(12);
      expect(mockPrisma.codeReview.create).toHaveBeenCalled();
      expect(mockPrisma.pullRequestReview.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if neither diff nor pullRequestNumber is provided', async () => {
      const mockRepo = { id: 'repo-1', owner: 'devcodex', name: 'core', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);

      await expect(service.reviewPr('user-1', 'devcodex/core', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getReviews', () => {
    it('should return reviews history', async () => {
      const mockRepo = { id: 'repo-1', owner: 'devcodex', name: 'core', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.codeReview.findMany.mockResolvedValue([
        { id: 'rev-1', overallRating: 'GOOD', issuesCount: 1 },
      ]);

      const res = await service.getReviews('user-1', 'devcodex/core');
      expect(res).toHaveLength(1);
      expect(mockPrisma.codeReview.findMany).toHaveBeenCalled();
    });
  });
});
