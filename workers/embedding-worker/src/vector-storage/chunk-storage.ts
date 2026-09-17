import { PrismaClient } from '@prisma/client';
import { CodeChunkData } from '../chunking/ast-chunker';

export class ChunkStorage {
  constructor(private readonly prisma: PrismaClient) {}

  public async saveChunks(
    repositoryId: string,
    fileId: string,
    chunks: Array<CodeChunkData & { embedding: number[] }>,
  ): Promise<number> {
    if (chunks.length === 0) return 0;

    // Deactivate previous active chunks for this file
    await this.prisma.codeChunk.updateMany({
      where: {
        repositoryId,
        fileId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Create new chunks
    let inserted = 0;
    for (const chunk of chunks) {
      await this.prisma.codeChunk.create({
        data: {
          repositoryId,
          fileId,
          filePath: chunk.filePath,
          content: chunk.content,
          language: chunk.language,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          chunkType: chunk.chunkType,
          symbol: chunk.symbol,
          contentHash: chunk.contentHash,
          embedding: chunk.embedding,
          isActive: true,
        },
      });
      inserted++;
    }

    return inserted;
  }
}
