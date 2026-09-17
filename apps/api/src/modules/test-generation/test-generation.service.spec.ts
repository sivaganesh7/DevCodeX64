import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

jest.mock('../github/github.service', () => ({
  GitHubService: jest.fn().mockImplementation(() => ({
    getFileContents: jest.fn(),
  })),
}));

import { TestGenerationService } from './test-generation.service';
import { PrismaService } from '../../database/prisma.service';
import { GitHubService } from '../github/github.service';

describe('TestGenerationService', () => {
  let service: TestGenerationService;

  const mockPrisma = {
    repository: {
      findFirst: jest.fn(),
    },
    repositoryFile: {
      findFirst: jest.fn(),
    },
    generatedTest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGitHubService = {
    getFileContents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestGenerationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GitHubService, useValue: mockGitHubService },
      ],
    }).compile();

    service = module.get<TestGenerationService>(TestGenerationService);
    jest.clearAllMocks();
  });

  const mockRepo = {
    id: 'repo-123',
    userId: 'user-123',
    owner: 'octocat',
    name: 'hello-world',
    defaultBranch: 'main',
  };

  describe('generateTest', () => {
    it('should throw NotFoundException if repository does not exist', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(null);

      await expect(
        service.generateTest('user-123', 'octocat/nonexistent', {
          filePath: 'src/calc.ts',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target file is not found', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.repositoryFile.findFirst.mockResolvedValue(null);
      mockGitHubService.getFileContents.mockResolvedValue(null);

      await expect(
        service.generateTest('user-123', 'octocat/hello-world', {
          filePath: 'src/missing.ts',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate unit tests using fallback when AI service is offline and persist in DB', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.repositoryFile.findFirst.mockResolvedValue({
        id: 'file-1',
        path: 'src/calc.ts',
        content: 'export function add(a: number, b: number) { return a + b; }',
      });

      const savedEntity = {
        id: 'test-uuid-1',
        repositoryId: 'repo-123',
        filePath: 'src/calc.ts',
        functionName: 'add',
        testContent: 'describe("add", () => { it("should work", () => {}) });',
        language: 'typescript',
        framework: 'jest',
        executionStatus: 'pending',
        testCases: [{ name: 'should add', category: 'HAPPY_PATH' }],
        executedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.generatedTest.create.mockResolvedValue(savedEntity);

      const result = await service.generateTest('user-123', 'octocat/hello-world', {
        filePath: 'src/calc.ts',
        functionName: 'add',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('test-uuid-1');
      expect(result.filePath).toBe('src/calc.ts');
      expect(result.framework).toBe('jest');
      expect(mockPrisma.generatedTest.create).toHaveBeenCalled();
    });
  });

  describe('executeTest', () => {
    it('should throw NotFoundException if test record is not found', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.generatedTest.findFirst.mockResolvedValue(null);

      await expect(
        service.executeTest('user-123', 'octocat/hello-world', 'nonexistent-test-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should execute test in sandbox and update status', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      const testRecord = {
        id: 'test-1',
        repositoryId: 'repo-123',
        filePath: 'src/calc.ts',
        testContent: 'describe("calc", () => {})',
        language: 'typescript',
        framework: 'jest',
        executionStatus: 'pending',
      };
      mockPrisma.generatedTest.findFirst.mockResolvedValue(testRecord);
      mockPrisma.generatedTest.update.mockImplementation(({ data }) => ({
        ...testRecord,
        ...data,
      }));

      const result = await service.executeTest('user-123', 'octocat/hello-world', 'test-1');

      expect(result).toBeDefined();
      expect(mockPrisma.generatedTest.update).toHaveBeenCalled();
      expect(result.executionStatus).toBe('passed');
    });
  });

  describe('getTests and getTestById', () => {
    it('should return list of tests for repository', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.generatedTest.findMany.mockResolvedValue([
        {
          id: 'test-1',
          repositoryId: 'repo-123',
          filePath: 'src/calc.ts',
          testContent: 'test',
          language: 'typescript',
          executionStatus: 'passed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const tests = await service.getTests('user-123', 'octocat/hello-world');
      expect(tests).toHaveLength(1);
      expect(tests[0].id).toBe('test-1');
    });

    it('should delete a test', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.generatedTest.findFirst.mockResolvedValue({ id: 'test-1', repositoryId: 'repo-123' });
      mockPrisma.generatedTest.delete.mockResolvedValue({ id: 'test-1' });

      const res = await service.deleteTest('user-123', 'octocat/hello-world', 'test-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.generatedTest.delete).toHaveBeenCalledWith({ where: { id: 'test-1' } });
    });
  });
});
