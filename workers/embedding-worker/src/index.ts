import { PrismaClient } from '@prisma/client';
import Queue from 'bull';
import * as dotenv from 'dotenv';
import path from 'path';
import { ASTChunker } from './chunking/ast-chunker';
import { EmbeddingClient } from './embeddings/embedding-client';
import { ChunkStorage } from './vector-storage/chunk-storage';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();
const embeddingClient = new EmbeddingClient();
const chunkStorage = new ChunkStorage(prisma);

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const redisConfig = {
  redis: {
    host: redisHost,
    port: redisPort,
  },
};

const indexingQueue = new Queue('repository_indexing', redisConfig);
const embeddingQueue = new Queue('embedding_generation', redisConfig);

async function processRepositoryIndex(job: Queue.Job<{ repositoryId: string; userId?: string }>) {
  const { repositoryId } = job.data;
  console.log(`[embedding-worker] Processing indexing for repository: ${repositoryId} (job: ${job.id})`);

  const files = await prisma.repositoryFile.findMany({
    where: { repositoryId },
  });

  if (files.length === 0) {
    console.log(`[embedding-worker] No files found for repository ${repositoryId}`);
    return { filesProcessed: 0, totalChunks: 0 };
  }

  let filesProcessed = 0;
  let totalChunks = 0;

  for (const file of files) {
    // Skip if empty or binary
    if (!file.content || file.size > 500000) {
      continue;
    }

    try {
      const chunks = ASTChunker.chunkFile(file.path, file.content);
      if (chunks.length === 0) continue;

      // Try AI service embeddings or fallback to deterministic vector
      const aiEmbeddings = await embeddingClient.generateEmbeddings(
        repositoryId,
        file.id,
        file.path,
        file.content,
        file.language || undefined,
      );

      const chunksWithEmbeddings = chunks.map((chunk, idx) => {
        const embedding =
          aiEmbeddings[idx] ||
          embeddingClient.generateDeterministicVector(chunk.content);
        return {
          ...chunk,
          embedding,
        };
      });

      const savedCount = await chunkStorage.saveChunks(
        repositoryId,
        file.id,
        chunksWithEmbeddings,
      );

      totalChunks += savedCount;
      filesProcessed++;
    } catch (err: any) {
      console.error(`[embedding-worker] Error processing file ${file.path}:`, err.message);
    }
  }

  console.log(
    `[embedding-worker] Indexing completed for repository ${repositoryId}. Processed ${filesProcessed} files, generated ${totalChunks} chunks.`,
  );

  return { filesProcessed, totalChunks };
}

indexingQueue.process('index_repository', async (job) => {
  return processRepositoryIndex(job);
});

embeddingQueue.process(async (job) => {
  return processRepositoryIndex(job);
});

indexingQueue.on('error', (err) => {
  console.error('[embedding-worker] Indexing queue error:', err);
});

embeddingQueue.on('error', (err) => {
  console.error('[embedding-worker] Embedding queue error:', err);
});

console.log(`[embedding-worker] Initialized. Listening on 'repository_indexing' & 'embedding_generation'...`);
