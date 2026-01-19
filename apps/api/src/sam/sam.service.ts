import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { CreateSamMemoryDto } from './dto/create-sam-memory.dto';
import { SamAuditService } from './sam-audit.service';
import { logger } from '../common/logger';

@Injectable()
export class SamService {
  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
    private audit: SamAuditService
  ) {}

  async create(userId: string, dto: CreateSamMemoryDto) {
    // Normalize and extract canonical phrases
    const canonicalPhrases = this.extractCanonicalPhrases(dto.title, dto.content);
    const summary = this.generateSummary(dto.content);

    // Create memory entry
    const memory = await this.prisma.samMemory.create({
      data: {
        userId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        summary,
        canonicalPhrases,
        tags: dto.tags.map(t => t.toLowerCase().trim()),
        sourceType: 'user',
        sourceRef: 'api',
        sourceUri: null,
        confidenceScore: dto.confidence_score,
        reliability: dto.reliability,
        embeddingModel: 'text-embedding-ada-002',
        embeddingDims: 1536,
        embeddingRef: '', // Will be updated after embedding generation
        contextWindow: {
          create: {
            appliesTo: dto.context_window.applies_to,
            excludes: dto.context_window.excludes
          }
        },
        decayPolicy: {
          create: {
            type: dto.decay_policy.type,
            halfLifeDays: dto.decay_policy.half_life_days,
            minConfidence: dto.decay_policy.min_confidence
          }
        },
        trainingExamples: dto.training_examples ? {
          create: dto.training_examples.map((ex, idx) => ({
            exampleId: `tr_${Date.now()}_${idx}`,
            userPrompt: ex.user,
            assistant: ex.assistant,
            assertions: ex.assertions,
            passRate: 0
          }))
        } : undefined
      },
      include: {
        contextWindow: true,
        decayPolicy: true,
        trainingExamples: true
      }
    });

    // Generate and store embedding
    const embeddingText = `${memory.title}\n${memory.content}\n${canonicalPhrases.join(' ')}`;
    try {
      await this.embeddings.generateAndStoreEmbedding(memory.id, userId, embeddingText);
    } catch (error) {
      logger.error(`Failed to generate embedding for SAM memory ${memory.id}:`, error);
    }

    // Audit
    await this.audit.logEvent(memory.id, 'created', { title: memory.title });

    return memory;
  }

  async findAll(userId: string, filter?: { archived?: boolean; tags?: string[]; search?: string }) {
    const where: any = { userId };

    if (filter?.archived !== undefined) {
      where.archiveFlag = filter.archived;
    }

    if (filter?.tags && filter.tags.length > 0) {
      where.tags = { hasSome: filter.tags };
    }

    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { content: { contains: filter.search, mode: 'insensitive' } },
        { summary: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.samMemory.findMany({
      where,
      include: {
        contextWindow: true,
        decayPolicy: true,
        trainingExamples: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findOne(id: string, userId: string) {
    const memory = await this.prisma.samMemory.findFirst({
      where: { id, userId },
      include: {
        contextWindow: true,
        decayPolicy: true,
        trainingExamples: true,
        versionHistory: { orderBy: { version: 'desc' }, take: 5 }
      }
    });

    if (!memory) {
      throw new NotFoundException(`SAM memory ${id} not found`);
    }

    return memory;
  }

  async update(id: string, userId: string, updates: Partial<CreateSamMemoryDto>) {
    const existing = await this.findOne(id, userId);

    // Create version history entry
    await this.prisma.samMemoryVersion.create({
      data: {
        memoryId: id,
        version: existing.version,
        title: existing.title,
        content: existing.content,
        summary: existing.summary,
        canonicalPhrases: existing.canonicalPhrases,
        tags: existing.tags,
        confidenceScore: existing.confidenceScore,
        reliability: existing.reliability,
        changelog: null // TODO: compute diff
      }
    });

    // Update memory
    const updated = await this.prisma.samMemory.update({
      where: { id },
      data: {
        title: updates.title ? updates.title.trim() : undefined,
        content: updates.content ? updates.content.trim() : undefined,
        summary: updates.content ? this.generateSummary(updates.content) : undefined,
        canonicalPhrases: updates.content ? this.extractCanonicalPhrases(updates.title || existing.title, updates.content) : undefined,
        tags: updates.tags ? updates.tags.map(t => t.toLowerCase().trim()) : undefined,
        confidenceScore: updates.confidence_score,
        reliability: updates.reliability,
        version: { increment: 1 }
      },
      include: {
        contextWindow: true,
        decayPolicy: true,
        trainingExamples: true
      }
    });

    // Re-generate embedding if content changed
    if (updates.content || updates.title) {
      const embeddingText = `${updated.title}\n${updated.content}\n${updated.canonicalPhrases.join(' ')}`;
      try {
        await this.embeddings.generateAndStoreEmbedding(id, userId, embeddingText);
      } catch (error) {
        logger.error(`Failed to re-generate embedding for SAM memory ${id}:`, error);
      }
    }

    // Audit
    await this.audit.logEvent(id, 'updated', { version: updated.version });

    return updated;
  }

  async archive(id: string, userId: string) {
    const memory = await this.findOne(id, userId);

    const updated = await this.prisma.samMemory.update({
      where: { id },
      data: { archiveFlag: true }
    });

    await this.audit.logEvent(id, 'archived', {});

    return updated;
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId); // Verify ownership

    await this.embeddings.deleteEmbedding(id);
    await this.prisma.samMemory.delete({ where: { id } });

    return { deleted: true };
  }

  private extractCanonicalPhrases(title: string, content: string): string[] {
    const phrases: string[] = [];

    // Add title
    phrases.push(title.toLowerCase().trim());

    // Extract key sentences from content
    const sentences = content.split(/[.!?]\s+/).filter(s => s.length > 10 && s.length < 100);
    phrases.push(...sentences.slice(0, 5).map(s => s.toLowerCase().trim()));

    return phrases.slice(0, 12);
  }

  private generateSummary(content: string): string {
    if (content.length <= 300) {
      return content.trim();
    }
    return content.substring(0, 297).trim() + '...';
  }
}
