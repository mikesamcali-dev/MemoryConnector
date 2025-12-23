import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CircuitBreakerService } from '../ai-circuit-breaker/circuit-breaker.service';
import { AI_COST_CONFIG } from '../config/ai-cost.config';
import { EnrichmentQueueService } from './enrichment-queue.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { logger } from '../common/logger';

@Injectable()
export class EnrichmentService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private circuitBreaker: CircuitBreakerService,
    private queueService: EnrichmentQueueService,
    private embeddingsService: EmbeddingsService,
    private config: ConfigService
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async performEnrichment(memoryId: string, userId: string): Promise<void> {
    const memory = await this.prisma.memory.findUnique({
      where: { id: memoryId },
    });

    if (!memory || !memory.textContent) {
      return;
    }

    // Check if allowed
    const { allowed, circuitState } = await this.circuitBreaker.canProcessAI(userId);
    if (!allowed || circuitState === 'open') {
      await this.queueService.enqueueEnrichment(memoryId, userId);
      return;
    }

    try {
      // Update status
      await this.prisma.memory.update({
        where: { id: memoryId },
        data: { enrichmentStatus: 'processing' },
      });

      // Classify memory type
      const classification = await this.classifyMemory(memory.textContent, userId);
      
      // Generate embedding
      const embedding = await this.generateEmbedding(memory.textContent, userId, memoryId);

      // Update memory
      await this.prisma.memory.update({
        where: { id: memoryId },
        data: {
          type: classification.type as any,
          enrichmentStatus: 'completed',
        },
      });

      // Store embedding
      await this.embeddingsService.generateAndStoreEmbedding(memoryId, userId, memory.textContent);

    } catch (error) {
      logger.error({ error, memoryId }, 'Enrichment failed');
      await this.prisma.memory.update({
        where: { id: memoryId },
        data: { enrichmentStatus: 'failed' },
      });
    }
  }

  private async classifyMemory(text: string, userId: string): Promise<{ type: string }> {
    if (!this.openai) {
      return { type: 'note' }; // Default if OpenAI not configured
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Classify this memory as one of: note, person, event, place, task. Return only the type.',
        },
        {
          role: 'user',
          content: text.slice(0, 1000),
        },
      ],
      max_tokens: 10,
    });

    const type = response.choices[0]?.message?.content?.trim().toLowerCase() || 'note';
    const validTypes = ['note', 'person', 'event', 'place', 'task'];
    const classifiedType = validTypes.includes(type) ? type : 'note';

    // Record cost
    await this.circuitBreaker.recordAICost(
      userId,
      'classification',
      response.usage?.total_tokens || 0,
      AI_COST_CONFIG.costs.classification,
      'gpt-3.5-turbo'
    );

    return { type: classifiedType };
  }

  private async generateEmbedding(text: string, userId: string, memoryId: string): Promise<number[]> {
    if (!this.openai) {
      return []; // Return empty if OpenAI not configured
    }

    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.slice(0, 8000),
    });

    // Record cost
    await this.circuitBreaker.recordAICost(
      userId,
      'embedding',
      response.usage.total_tokens,
      AI_COST_CONFIG.costs.embedding,
      'text-embedding-ada-002',
      memoryId
    );

    return response.data[0].embedding;
  }
}

