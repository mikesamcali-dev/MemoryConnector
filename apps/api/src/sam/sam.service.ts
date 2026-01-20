import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { CreateSamMemoryDto } from './dto/create-sam-memory.dto';
import { SamAuditService } from './sam-audit.service';
import { SamReviewSchedulingService } from './sam-review-scheduling.service';
import { logger } from '../common/logger';
import OpenAI from 'openai';

@Injectable()
export class SamService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
    private audit: SamAuditService,
    private config: ConfigService,
    @Inject(forwardRef(() => SamReviewSchedulingService))
    private reviewScheduling: SamReviewSchedulingService
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async create(userId: string, dto: CreateSamMemoryDto) {
    // Generate title with AI if not provided
    const title = dto.title?.trim() || await this.generateTitle(dto.content);

    // Normalize and extract canonical phrases
    const canonicalPhrases = this.extractCanonicalPhrases(title, dto.content);
    const summary = this.generateSummary(dto.content);

    // Create memory entry
    const memory = await this.prisma.samMemory.create({
      data: {
        userId,
        title,
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

    // Schedule first review (1 day from now)
    try {
      await this.reviewScheduling.createSchedule(memory.id, userId);
    } catch (error) {
      logger.error(`Failed to create review schedule for SAM memory ${memory.id}:`, error);
    }

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

  async generateKeywords(term: string): Promise<string[]> {
    if (!this.openai) {
      return [];
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a semantic analyst that extracts domain keywords and concept categories.

For each term, identify:
1. Concept domains (e.g., ideology, governance, state power)
2. Key attributes (e.g., authoritarianism, nationalism, repression)
3. Related concepts from ontology

Return 6-8 high-level keywords as a comma-separated list.
Focus on abstract domains and categorical terms, not synonyms.

Example for "fascist": ideology, governance, authoritarianism, nationalism, state power, totalitarianism, political movement, repression`
          },
          {
            role: 'user',
            content: `Extract domain keywords for: ${term}`
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      });

      const keywordsText = response.choices[0]?.message?.content?.trim();
      if (keywordsText && keywordsText.length > 0) {
        return keywordsText.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0).slice(0, 8);
      }

      return [];
    } catch (error) {
      logger.error('Failed to extract keywords with AI:', error);
      return [];
    }
  }

  async generateDefinition(term: string): Promise<string> {
    if (!this.openai) {
      // Fallback: return a simple message if OpenAI not configured
      return `Definition for: ${term}`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that provides comprehensive, educational definitions.

For each term, provide:

1. Phonetic pronunciation in IPA notation on the first line (e.g., /ˈfæʃɪst/) - NO LABEL
2. Part of Speech on the second line (noun, verb, adjective, etc.) - NO LABEL
3. Definition (1-3 clear sentences)
4. Etymology (origin and history of the word)
5. Examples (3 real-world usage examples as bullet points - NO "Examples:" header)
6. Synonyms (3-5 related words)
7. Antonyms (3-5 opposite words)

IMPORTANT FORMAT RULES:
- Do NOT use labels for phonetic pronunciation or part of speech
- Do NOT use "Examples:" as a header - just list the example bullet points directly after Etymology
- Only use section headers for: Definition, Etymology, Synonyms, Antonyms
- Example bullets should appear right after the Etymology section with no header`
          },
          {
            role: 'user',
            content: `Provide a comprehensive definition for: ${term}`
          }
        ],
        temperature: 0.7,
        max_tokens: 900
      });

      const definition = response.choices[0]?.message?.content?.trim();
      if (definition && definition.length > 0) {
        return definition;
      }

      // Fallback if AI response is empty
      return `Definition for: ${term}`;
    } catch (error) {
      logger.error('Failed to generate definition with AI:', error);
      // Fallback on error
      return `Definition for: ${term}`;
    }
  }

  private async generateTitle(content: string): Promise<string> {
    if (!this.openai) {
      // Fallback: use first few words if OpenAI not configured
      const words = content.trim().split(/\s+/).slice(0, 6);
      return words.join(' ').substring(0, 60);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates concise, descriptive titles for memories. Generate a short title (3-8 words) that captures the essence of the content. Return only the title, nothing else.'
          },
          {
            role: 'user',
            content: `Generate a title for this memory:\n\n${content.substring(0, 500)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 30
      });

      const generatedTitle = response.choices[0]?.message?.content?.trim();
      if (generatedTitle && generatedTitle.length > 0) {
        // Remove quotes if AI wrapped the title in quotes
        return generatedTitle.replace(/^["']|["']$/g, '').substring(0, 120);
      }

      // Fallback if AI response is empty
      const words = content.trim().split(/\s+/).slice(0, 6);
      return words.join(' ').substring(0, 60);
    } catch (error) {
      logger.error('Failed to generate title with AI:', error);
      // Fallback: use first few words
      const words = content.trim().split(/\s+/).slice(0, 6);
      return words.join(' ').substring(0, 60);
    }
  }
}
