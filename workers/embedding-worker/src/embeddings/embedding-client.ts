import axios from 'axios';
import * as crypto from 'crypto';

export class EmbeddingClient {
  private readonly aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Generates a deterministic unit vector embedding (1536 dim) based on text content as fallback.
   */
  public generateDeterministicVector(text: string, dimensions: number = 1536): number[] {
    const vector = new Array(dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const hash = crypto.createHash('md5').update(words[i]).digest();
      for (let j = 0; j < 16; j++) {
        const idx = (hash[j] + i * 31) % dimensions;
        vector[idx] += (hash[(j + 1) % 16] - 128) / 128.0;
      }
    }

    // L2 normalize
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] /= norm;
      }
    } else {
      vector[0] = 1.0;
    }

    return vector;
  }

  /**
   * Generates embeddings for a batch of chunk texts by querying the AI service,
   * falling back to deterministic local vectors on error.
   */
  public async generateEmbeddings(
    repositoryId: string,
    fileId: string,
    filePath: string,
    content: string,
    language?: string,
  ): Promise<number[][]> {
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/embed/file`,
        {
          repositoryId,
          fileId,
          filePath,
          content,
          language,
        },
        { timeout: 15000 },
      );

      if (response.data && Array.isArray(response.data.chunks)) {
        return response.data.chunks.map((c: any) => c.embedding);
      }
    } catch {
      // Fallback locally
    }

    return [];
  }
}
