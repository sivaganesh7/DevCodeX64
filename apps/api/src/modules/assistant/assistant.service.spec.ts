import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { AssistantService } from './assistant.service';
import { PrismaService } from '../../database/prisma.service';

describe('AssistantService', () => {
  let service: AssistantService;

  const mockPrisma = {
    repository: {
      findFirst: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    conversationMessage: {
      create: jest.fn(),
    },
    aIResponse: {
      create: jest.fn(),
    },
    analysisJob: {
      findFirst: jest.fn(),
    },
    codeChunk: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    repositoryFile: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    securityFinding: {
      findMany: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssistantService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('repository_indexing'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<AssistantService>(AssistantService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkRepoAccess', () => {
    it('should return repository when found by owner and repo', async () => {
      const mockRepo = { id: 'repo-1', owner: 'testowner', name: 'testrepo', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);

      const result = await service.checkRepoAccess('user-1', 'testowner/testrepo');
      expect(result).toEqual(mockRepo);
      expect(mockPrisma.repository.findFirst).toHaveBeenCalledWith({
        where: { owner: 'testowner', name: 'testrepo', userId: 'user-1' },
      });
    });

    it('should throw NotFoundException when repository is not found', async () => {
      mockPrisma.repository.findFirst.mockResolvedValue(null);

      await expect(service.checkRepoAccess('user-1', 'nonexistent/repo')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createConversation', () => {
    it('should create conversation with default title if omitted', async () => {
      const mockRepo = { id: 'repo-1', owner: 'owner', name: 'repo', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.conversation.create.mockResolvedValue({
        id: 'conv-1',
        title: 'New Chat',
        userId: 'user-1',
        repositoryId: 'repo-1',
      });

      const result = await service.createConversation('user-1', 'owner/repo', {});
      expect(result.id).toBe('conv-1');
      expect(mockPrisma.conversation.create).toHaveBeenCalled();
    });
  });

  describe('getConversations', () => {
    it('should return list of conversations for repo', async () => {
      const mockRepo = { id: 'repo-1', owner: 'owner', name: 'repo', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.conversation.findMany.mockResolvedValue([
        { id: 'conv-1', title: 'Architecture Question' },
      ]);

      const result = await service.getConversations('user-1', 'owner/repo');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Architecture Question');
    });
  });

  describe('triggerIndexing', () => {
    it('should add indexing job to Bull queue', async () => {
      const mockRepo = { id: 'repo-1', owner: 'owner', name: 'repo', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);

      const result = await service.triggerIndexing('user-1', 'owner/repo');
      expect(result.status).toBe('QUEUED');
      expect(result.jobId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith('index_repository', expect.objectContaining({
        repositoryId: 'repo-1',
        userId: 'user-1',
      }));
    });
  });

  describe('getIndexingStatus', () => {
    it('should return chunk counts and isIndexed boolean', async () => {
      const mockRepo = { id: 'repo-1', owner: 'owner', name: 'repo', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.codeChunk.count.mockResolvedValue(42);
      mockPrisma.repositoryFile.count.mockResolvedValue(10);

      const result = await service.getIndexingStatus('user-1', 'owner/repo');
      expect(result.isIndexed).toBe(true);
      expect(result.indexedChunks).toBe(42);
      expect(result.totalFiles).toBe(10);
    });
  });

  describe('runAgentTask', () => {
    it('should execute agent task and return ReAct steps', async () => {
      const mockRepo = { id: 'repo-1', owner: 'owner', name: 'repo', userId: 'user-1' };
      mockPrisma.repository.findFirst.mockResolvedValue(mockRepo);
      mockPrisma.conversation.create.mockResolvedValue({
        id: 'conv-agent-1',
        title: 'Agent Task',
      });
      mockPrisma.conversationMessage.create.mockImplementation((args) =>
        Promise.resolve({
          id: 'msg-1',
          conversationId: args.data.conversationId,
          role: args.data.role,
          content: args.data.content,
          createdAt: new Date(),
        }),
      );
      mockPrisma.aIResponse.create.mockResolvedValue({ id: 'resp-1' });
      mockPrisma.conversation.update.mockResolvedValue({});

      // Mock prisma lookups for fallback
      mockPrisma.securityFinding = { findMany: jest.fn().mockResolvedValue([]) };
      mockPrisma.repositoryFile.findMany = jest.fn().mockResolvedValue([{ path: 'src/main.ts' }]);

      const res = await service.runAgentTask('user-1', 'owner/repo', {
        task: 'Audit security vulnerabilities in auth module',
      });

      expect(res).toBeDefined();
      expect(res.task).toBe('Audit security vulnerabilities in auth module');
      expect(res.steps.length).toBeGreaterThan(0);
      expect(res.finalAnswer).toBeDefined();
      expect(res.success).toBe(true);
      expect(mockPrisma.conversationMessage.create).toHaveBeenCalledTimes(2); // user + assistant
    });
  });
});
