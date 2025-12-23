import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '../ai-circuit-breaker/circuit-breaker.service';
import { AI_COST_CONFIG } from '../config/ai-cost.config';
import { logger } from '../common/logger';

@Injectable()
export class EmbeddingsService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private circuitBreaker: CircuitBreakerService,
    private config: ConfigService
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateAndStoreEmbedding(
    memoryId: string,
    userId: string,
    text: string
  ): Promise<void> {
    if (!this.openai) {
      logger.warn('OpenAI not configured, skipping embedding generation');
      return;
    }

    // Generate embedding
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.slice(0, 8000),
    });

    const embedding = response.data[0].embedding;
    const tokensUsed = response.usage.total_tokens;

    // Store embedding using raw SQL for pgvector
    await this.prisma.$executeRaw`
      INSERT INTO embeddings (id, memory_id, user_id, vector, model_version)
      VALUES (gen_random_uuid(), ${memoryId}::uuid, ${userId}::uuid, ${JSON.stringify(embedding)}::vector(1536), 'text-embedding-ada-002')
      ON CONFLICT (id) DO UPDATE SET vector = ${JSON.stringify(embedding)}::vector(1536), created_at = NOW()
    `;

    // Record cost
    await this.circuitBreaker.recordAICost(
      userId,
      'embedding',
      tokensUsed,
      AI_COST_CONFIG.costs.embedding,
      'text-embedding-ada-002',
      memoryId
    );
  }

  async generateQueryEmbedding(query: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query.slice(0, 1000),
    });

    return response.data[0].embedding;
  }

  async deleteEmbedding(memoryId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM embeddings WHERE memory_id = ${memoryId}::uuid
    `;
  }

  async searchSimilar(
    userId: string,
    queryVector: number[],
    limit: number = 20
  ): Promise<Array<{ memoryId: string; similarity: number }>> {
    const result = await this.prisma.$queryRaw<Array<{ memory_id: string; similarity: number }>>`
      SELECT memory_id, similarity
      FROM search_similar_embeddings(${userId}::uuid, ${JSON.stringify(queryVector)}::vector(1536), ${limit})
    `;

    return result.map((r) => ({
      memoryId: r.memory_id,
      similarity: r.similarity,
    }));
  }
}

