/**
 * SAM Retrieval Service - Hybrid retrieval and ranking
 */

import {
  RecallContext,
  RecallConfig,
  RecallResult,
  RankedMemory,
  SuggestedAction,
  DEFAULT_SAM_CONFIG
} from '../domain/types';
import {
  buildQueryText,
  exactMatchScore,
  recencyScore,
  compositeScore,
  buildRationale,
  makeHighlights,
  round3,
  detectConflict
} from '../domain/scoring';
import { IMemoryRepo } from '../repo/MemoryRepo';
import { IVectorIndex } from '../vector/VectorIndex';
import { IEmbeddingsService } from '../embeddings/Embeddings';
import { AuditService } from './AuditService';

export class RetrievalService {
  constructor(
    private repo: IMemoryRepo,
    private vectorIndex: IVectorIndex,
    private embeddings: IEmbeddingsService,
    private auditService: AuditService,
    private config: RecallConfig = DEFAULT_SAM_CONFIG
  ) {}

  /**
   * Recall memories using hybrid retrieval
   */
  async recall(context: RecallContext): Promise<RecallResult> {
    const { current_conversation, active_task, ui_state } = context;

    // Build query text
    const queryText = buildQueryText({
      current_conversation,
      active_task,
      ui_state,
      lastTurns: 8
    });

    if (!queryText || queryText.trim().length === 0) {
      return this.emptyResult('No query context available');
    }

    // Generate query embedding
    const queryEmbedding = await this.embeddings.generate(queryText, this.config.embedding_model);

    // Vector search
    const vecHits = await this.vectorIndex.query(
      queryEmbedding.vector,
      this.config.vector_top_k,
      { archive_flag: false }
    );

    if (vecHits.length === 0) {
      return this.emptyResult('No matching memories found', queryText, active_task);
    }

    // Fetch memory entries
    const candidates = await this.repo.getMany(vecHits.map(h => h.id));

    // Score each candidate
    const scored = candidates.map(mem => {
      const vecHit = vecHits.find(v => v.id === mem.id);
      const semantic = vecHit?.score ?? 0;
      const exact = exactMatchScore(queryText, mem.canonical_phrases);
      const recency = recencyScore(mem.last_used_at, this.config.recency_window_days);
      const confidence = mem.confidence_score;

      const score = compositeScore(
        { semantic, exact, recency, confidence },
        this.config.weights
      );

      return {
        mem,
        score,
        signals: { semantic, exact, recency, confidence }
      };
    });

    // Filter by thresholds
    const filtered = scored.filter(
      x => x.signals.semantic >= this.config.similarity_threshold || x.signals.exact >= 0.6
    );

    if (filtered.length === 0 || filtered[0].score < this.config.composite_score_min) {
      return this.emptyResult('No memories meet confidence threshold', queryText, active_task);
    }

    // Sort and rerank
    filtered.sort((a, b) => b.score - a.score);
    const topCandidates = filtered.slice(0, this.config.rerank_top_n);

    // Build ranked results
    const ranked: RankedMemory[] = topCandidates.slice(0, this.config.recall_top_n).map(x => ({
      id: x.mem.id,
      title: x.mem.title,
      summary: x.mem.summary,
      score: round3(x.score),
      signals: {
        semantic: round3(x.signals.semantic),
        exact: round3(x.signals.exact),
        recency: round3(x.signals.recency),
        confidence: round3(x.signals.confidence)
      },
      rationale: buildRationale(x.mem, x.signals, ui_state, active_task),
      highlights: makeHighlights(queryText, x.mem)
    }));

    // Detect conflicts
    const conflicts: Array<[number, number]> = [];
    for (let i = 0; i < ranked.length; i++) {
      for (let j = i + 1; j < ranked.length; j++) {
        const mem1 = candidates.find(c => c.id === ranked[i].id)!;
        const mem2 = candidates.find(c => c.id === ranked[j].id)!;
        if (detectConflict(mem1, mem2)) {
          conflicts.push([i, j]);
        }
      }
    }

    // Build suggested actions
    const suggested_follow_up_actions: SuggestedAction[] = [];

    if (conflicts.length > 0) {
      suggested_follow_up_actions.push({
        type: 'clarify_conflict',
        label: 'Conflicting memories detected - review and resolve',
        payload: { conflicts }
      });
    }

    // Audit recall event
    await this.auditService.append({
      event_type: 'memory_recalled',
      memory_id: ranked.map(r => r.id).join(','),
      timestamp: new Date().toISOString(),
      details: {
        query_text: queryText,
        active_task,
        count: ranked.length,
        top_score: ranked[0]?.score
      }
    });

    return {
      action: 'recall',
      ok: true,
      ui_summary: {
        message: `Found ${ranked.length} relevant ${ranked.length === 1 ? 'memory' : 'memories'}`,
        next_steps: [
          'Review recalled memories and their rationales',
          'Apply relevant memories to current task',
          'Confirm or correct if needed'
        ]
      },
      redaction_report: { items: [], total_count: 0 },
      data: {
        ranked_memory_list: ranked,
        suggested_follow_up_actions
      }
    };
  }

  /**
   * Empty result with fail-safe
   */
  private emptyResult(reason: string, queryText?: string, activeTask?: string): RecallResult {
    const suggested_follow_up_actions: SuggestedAction[] = [];

    if (queryText && activeTask) {
      // Suggest creating new memory
      suggested_follow_up_actions.push({
        type: 'create_new_memory_prefill',
        label: 'Create new memory for this context',
        payload: {
          title: activeTask.substring(0, 100),
          content: queryText.substring(0, 500),
          tags: [],
          canonical_phrases: []
        }
      });
    }

    return {
      action: 'recall',
      ok: false,
      ui_summary: {
        message: reason,
        next_steps: ['Consider creating a new memory', 'Refine search context']
      },
      redaction_report: { items: [], total_count: 0 },
      data: {
        ranked_memory_list: [],
        suggested_follow_up_actions
      }
    };
  }
}
