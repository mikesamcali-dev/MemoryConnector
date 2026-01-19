import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SamAuditService } from './sam-audit.service';
import { RecallSamMemoryDto } from './dto/recall-sam-memory.dto';

export interface ScoringSignals {
  semantic: number;
  exact: number;
  recency: number;
  confidence: number;
}

export interface RankedMemory {
  id: string;
  title: string;
  summary: string;
  score: number;
  signals: ScoringSignals;
  rationale: string;
  highlights: string[];
}

@Injectable()
export class SamRetrievalService {
  private readonly CONFIG = {
    vector_top_k: 10,
    similarity_threshold: 0.75,
    composite_score_min: 0.65,
    recency_window_days: 30,
    weights: {
      semantic: 0.50,
      exact: 0.20,
      recency: 0.15,
      confidence: 0.15
    },
    recall_top_n: 5
  };

  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
    private audit: SamAuditService
  ) {}

  async recall(userId: string, dto: RecallSamMemoryDto): Promise<{
    memories: RankedMemory[];
    fallback: boolean;
  }> {
    // Build query text
    const queryText = this.buildQueryText(dto);

    if (!queryText) {
      return { memories: [], fallback: true };
    }

    // Generate query embedding
    const queryVector = await this.embeddings.generateQueryEmbedding(queryText);

    // Search similar embeddings
    const similarResults = await this.embeddings.searchSimilar(
      userId,
      queryVector,
      this.CONFIG.vector_top_k
    );

    if (similarResults.length === 0) {
      return { memories: [], fallback: true };
    }

    // Fetch memory entries
    const memoryIds = similarResults.map(r => r.memoryId);
    const memories = await this.prisma.samMemory.findMany({
      where: {
        id: { in: memoryIds },
        userId,
        archiveFlag: false
      },
      include: {
        contextWindow: true,
        decayPolicy: true
      }
    });

    // Score and rank
    const scored = memories.map(mem => {
      const vecResult = similarResults.find(r => r.memoryId === mem.id);
      const semantic = vecResult?.similarity ?? 0;
      const exact = this.exactMatchScore(queryText, mem.canonicalPhrases);
      const recency = this.recencyScore(mem.lastUsedAt);
      const confidence = mem.confidenceScore;

      const score = this.compositeScore({ semantic, exact, recency, confidence });

      return {
        memory: mem,
        score,
        signals: { semantic, exact, recency, confidence }
      };
    });

    // Filter and sort
    const filtered = scored
      .filter(x => x.signals.semantic >= this.CONFIG.similarity_threshold || x.signals.exact >= 0.6)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.CONFIG.recall_top_n);

    if (filtered.length === 0 || filtered[0].score < this.CONFIG.composite_score_min) {
      return { memories: [], fallback: true };
    }

    // Build ranked results
    const ranked: RankedMemory[] = filtered.map(x => ({
      id: x.memory.id,
      title: x.memory.title,
      summary: x.memory.summary,
      score: Math.round(x.score * 1000) / 1000,
      signals: {
        semantic: Math.round(x.signals.semantic * 1000) / 1000,
        exact: Math.round(x.signals.exact * 1000) / 1000,
        recency: Math.round(x.signals.recency * 1000) / 1000,
        confidence: Math.round(x.signals.confidence * 1000) / 1000
      },
      rationale: this.buildRationale(x.memory, x.signals, dto.active_task),
      highlights: this.makeHighlights(queryText, x.memory)
    }));

    // Audit recall events
    for (const mem of ranked) {
      await this.audit.logEvent(mem.id, 'recalled', {
        query: queryText.substring(0, 200),
        score: mem.score
      });

      // Increment usage count
      await this.prisma.samMemory.update({
        where: { id: mem.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      });
    }

    return { memories: ranked, fallback: false };
  }

  private buildQueryText(dto: RecallSamMemoryDto): string {
    const parts: string[] = [];

    if (dto.active_task) {
      parts.push(dto.active_task.trim());
    }

    const recentTurns = dto.conversation.slice(-8);
    recentTurns.forEach(turn => {
      if (turn.content) {
        parts.push(turn.content.trim());
      }
    });

    if (dto.ui_state?.selection) {
      parts.push(dto.ui_state.selection);
    }

    return parts.join(' ');
  }

  private exactMatchScore(queryText: string, phrases: string[]): number {
    if (!phrases || phrases.length === 0) return 0;

    const lowerQuery = queryText.toLowerCase();
    let hits = 0;

    for (const phrase of phrases) {
      if (lowerQuery.includes(phrase.toLowerCase())) {
        hits++;
      }
    }

    return Math.min(hits / phrases.length, 1.0);
  }

  private recencyScore(lastUsedAt: Date | null): number {
    if (!lastUsedAt) return 0;

    const now = new Date();
    const daysSince = (now.getTime() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince < 0) return 1.0;

    return Math.exp(-daysSince / this.CONFIG.recency_window_days);
  }

  private compositeScore(signals: ScoringSignals): number {
    const w = this.CONFIG.weights;
    const score =
      w.semantic * signals.semantic +
      w.exact * signals.exact +
      w.recency * signals.recency +
      w.confidence * signals.confidence;

    return Math.max(0, Math.min(1, score));
  }

  private buildRationale(memory: any, signals: ScoringSignals, activeTask: string): string {
    const reasons: string[] = [];

    const sortedSignals = Object.entries(signals).sort((a, b) => b[1] - a[1]);

    sortedSignals.slice(0, 2).forEach(([name, value]) => {
      if (value >= 0.7) {
        if (name === 'semantic') reasons.push(`high semantic match (${value.toFixed(2)})`);
        else if (name === 'exact') reasons.push(`exact phrase match (${value.toFixed(2)})`);
        else if (name === 'recency') reasons.push(`recently used (${value.toFixed(2)})`);
        else if (name === 'confidence') reasons.push(`high confidence (${value.toFixed(2)})`);
      }
    });

    if (activeTask && memory.tags.some((t: string) => activeTask.toLowerCase().includes(t))) {
      reasons.push(`relevant to current task`);
    }

    return `Recalled due to ${reasons.join(', ')}.`;
  }

  private makeHighlights(queryText: string, memory: any): string[] {
    const highlights: string[] = [];
    const lowerQuery = queryText.toLowerCase();
    const lowerContent = memory.content.toLowerCase();

    for (const phrase of memory.canonicalPhrases.slice(0, 3)) {
      if (lowerQuery.includes(phrase) && lowerContent.includes(phrase)) {
        const index = lowerContent.indexOf(phrase);
        if (index !== -1) {
          const start = Math.max(0, index - 40);
          const end = Math.min(memory.content.length, index + phrase.length + 40);
          let snippet = memory.content.substring(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < memory.content.length) snippet = snippet + '...';
          highlights.push(snippet);
        }
      }
    }

    return highlights.slice(0, 3);
  }
}
