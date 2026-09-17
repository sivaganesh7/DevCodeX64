import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

jest.mock('../github/github.service', () => ({
  GitHubService: jest.fn().mockImplementation(() => ({
    getFileContents: jest.fn(),
  })),
}));

import { DocumentationService } from './documentation.service';
import { PrismaService } from '../../database/prisma.service';
import { GitHubService } from '../github/github.service';

describe('DocumentationService', () => {
  let service: DocumentationService;

  const mockPrisma = {
    repository: {
      findFirst: jest.fn(),
    },
    repositoryFile: {
      findFirst: jest.fn(),
    },
    documentation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGitHubService = {
    getFileContents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GitHubService, useValue: mockGitHubService },
      ],
    }).compile();

    service = module.get<DocumentationService>(DocumentationService);
    jest.clearAllMocks();
  });

  const mockRepo = {
    id: 'repo-123',
    userId: 'user-123',
    owner: 'octocat',
    name: 'hello-world',
    defaultBranch: 'main',
    description: 'A friendly sample repository',
  };

  describe('generateDocumentation', () => {
    it('should throw NotFoundException if repository does not exist', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(null);

      await expect(
        service.generateDocumentation('user-123', 'octocat/nonexistent', {
          docType: 'README',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate documentation artifact and persist in database', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.repositoryFile.findFirst.mockResolvedValue(null);

      const savedDoc = {
        id: 'doc-uuid-1',
        repositoryId: 'repo-123',
        userId: 'user-123',
        docType: 'README',
        title: 'hello-world — README Documentation',
        content: '# hello-world\nA friendly sample repository.',
        filePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.documentation.create.mockResolvedValue(savedDoc);

      const result = await service.generateDocumentation('user-123', 'octocat/hello-world', {
        docType: 'README',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('doc-uuid-1');
      expect(result.docType).toBe('README');
      expect(mockPrisma.documentation.create).toHaveBeenCalled();
    });
  });

  describe('getDocumentations and getDocumentationById', () => {
    it('should return list of documentation artifacts', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.documentation.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          repositoryId: 'repo-123',
          docType: 'API',
          title: 'API Reference',
          content: '# API',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const docs = await service.getDocumentations('user-123', 'octocat/hello-world');
      expect(docs).toHaveLength(1);
      expect(docs[0].docType).toBe('API');
    });

    it('should get single documentation by id', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.documentation.findFirst.mockResolvedValue({
        id: 'doc-1',
        repositoryId: 'repo-123',
        docType: 'ARCHITECTURE',
        title: 'Architecture Overview',
        content: '# Architecture',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const doc = await service.getDocumentationById('user-123', 'octocat/hello-world', 'doc-1');
      expect(doc.id).toBe('doc-1');
      expect(doc.docType).toBe('ARCHITECTURE');
    });

    it('should delete documentation artifact', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.documentation.findFirst.mockResolvedValue({ id: 'doc-1', repositoryId: 'repo-123' });
      mockPrisma.documentation.delete.mockResolvedValue({ id: 'doc-1' });

      const res = await service.deleteDocumentation('user-123', 'octocat/hello-world', 'doc-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.documentation.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
    });
  });
});
