/**
 * SAM Memory Service - Core business logic for memory management
 */

import {
  SamMemoryEntry,
  SamMemoryDraft,
  SamEnrichmentPreview,
  CreateResult,
  ChangelogDiff,
  DEFAULT_DECAY_POLICY
} from '../domain/types';
import { normalizeForStorage } from '../domain/normalize';
import { redactMemoryDraft } from '../domain/redact';
import { IMemoryRepo } from '../repo/MemoryRepo';
import { IEmbeddingsService } from '../embeddings/Embeddings';
import { IVectorIndex } from '../vector/VectorIndex';
import { TrainingService } from './TrainingService';
import { AuditService } from './AuditService';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as schema from '../schema/memoryEntry.schema.json';

export class MemoryService {
  private ajv: Ajv;
  private validator: any;

  constructor(
    private repo: IMemoryRepo,
    private embeddings: IEmbeddingsService,
    private vectorIndex: IVectorIndex,
    private trainingService: TrainingService,
    private auditService: AuditService
  ) {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.validator = this.ajv.compile(schema);
  }

  /**
   * Preview enrichment for a draft memory
   */
  static previewEnrichment(draft: SamMemoryDraft): SamEnrichmentPreview {
    // Generate summary (simple truncation for now)
    const summary = draft.content.length > 300
      ? draft.content.substring(0, 297) + '...'
      : draft.content;

    // Suggest canonical phrases based on title and content
    const canonical_phrases = this.extractCanonicalPhrases(draft.title, draft.content);

    // Suggest tags based on content
    const suggested_tags = this.extractTags(draft.content, draft.tags);

    return {
      summary,
      canonical_phrases,
      suggested_tags,
      pii_warnings: [],
      embedding_ready: draft.content.length >= 10
    };
  }

  /**
   * Create a new memory from draft
   */
  async createFromDraft(params: {
    draft: SamMemoryDraft;
    preview: SamEnrichmentPreview
  }): Promise<CreateResult> {
    const { draft, preview } = params;

    // Normalize and redact
    const normalized = normalizeForStorage(draft);
    const { draft: cleaned, report: redaction_report } = redactMemoryDraft(normalized);

    // Generate ID
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build full entry
    const entry: SamMemoryEntry = {
      id,
      title: cleaned.title,
      content: cleaned.content,
      summary: preview.summary,
      canonical_phrases: preview.canonical_phrases,
      tags: [...new Set([...cleaned.tags, ...preview.suggested_tags])],
      source: cleaned.source,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      confidence_score: cleaned.confidence_score,
      reliability: cleaned.reliability,
      usage_count: 0,
      last_used_at: null,
      context_window: cleaned.context_window,
      training_examples: cleaned.training_examples || [],
      decay_policy: cleaned.decay_policy,
      archive_flag: false,
      version: 1,
      embeddings: {
        model: 'text-embedding-ada-002',
        dims: 1536,
        vector_ref: `vec://${id}`
      }
    };

    // Validate schema
    const valid = this.validator(entry);
    if (!valid) {
      return {
        action: 'create',
        ok: false,
        ui_summary: {
          message: 'Validation failed',
          next_steps: this.validator.errors?.map((e: any) => e.message) || []
        },
        redaction_report,
        data: {
          memory: entry,
          suggested_training_examples: [],
          embedding_hint: { model: '', dims: 0, text_hash: '' },
          ui_payload: { errors: this.validator.errors }
        }
      };
    }

    // Generate embedding
    const embeddingText = `${entry.title}\n${entry.content}\n${entry.canonical_phrases.join(' ')}`;
    const embeddingResult = await this.embeddings.generate(embeddingText, entry.embeddings.model);

    // Store in vector index
    await this.vectorIndex.upsert(id, embeddingResult.vector, {
      memoryId: id,
      archive_flag: false,
      tags: entry.tags
    });

    // Save to repository
    await this.repo.create(entry);

    // Generate training examples if not provided
    let training_examples = entry.training_examples;
    if (training_examples.length === 0) {
      training_examples = await this.trainingService.suggestTrainingExamples({
        title: entry.title,
        content: entry.content,
        canonical_phrases: entry.canonical_phrases
      });
    }

    // Audit
    await this.auditService.append({
      event_type: 'memory_created',
      memory_id: id,
      timestamp: new Date().toISOString(),
      details: { title: entry.title }
    });

    return {
      action: 'create',
      ok: true,
      ui_summary: {
        message: `Memory "${entry.title}" created successfully`,
        next_steps: [
          'Review and run training examples',
          'Add to collection or tag for organization',
          'Memory is now active and will be recalled when relevant'
        ]
      },
      redaction_report,
      data: {
        memory: entry,
        suggested_training_examples: training_examples,
        embedding_hint: {
          model: embeddingResult.model,
          dims: embeddingResult.dims,
          text_hash: embeddingResult.text_hash
        },
        ui_payload: {}
      }
    };
  }

  /**
   * Update an existing memory
   */
  async update(
    id: string,
    updates: Partial<SamMemoryDraft>
  ): Promise<{ ok: boolean; memory?: SamMemoryEntry; changelog?: ChangelogDiff[] }> {
    const existing = await this.repo.get(id);
    if (!existing) {
      return { ok: false };
    }

    // Build changelog
    const changelog: ChangelogDiff[] = [];

    if (updates.title && updates.title !== existing.title) {
      changelog.push({ path: 'title', before: existing.title, after: updates.title, reason: 'User edit' });
    }

    if (updates.content && updates.content !== existing.content) {
      changelog.push({ path: 'content', before: existing.content, after: updates.content, reason: 'User edit' });
    }

    // Normalize and redact updates
    const normalized = normalizeForStorage(updates);
    const { draft: cleaned } = redactMemoryDraft(normalized);

    // Re-generate enrichment if content changed
    let newSummary = existing.summary;
    let newCanonicalPhrases = existing.canonical_phrases;

    if (cleaned.content) {
      const preview = MemoryService.previewEnrichment({
        ...existing,
        ...cleaned
      } as SamMemoryDraft);
      newSummary = preview.summary;
      newCanonicalPhrases = preview.canonical_phrases;
    }

    // Update repository
    const updated = await this.repo.update(id, {
      ...cleaned,
      summary: newSummary,
      canonical_phrases: newCanonicalPhrases
    });

    // Re-embed if content or phrases changed
    if (cleaned.content || cleaned.title) {
      const embeddingText = `${updated.title}\n${updated.content}\n${updated.canonical_phrases.join(' ')}`;
      const embeddingResult = await this.embeddings.generate(embeddingText, updated.embeddings.model);
      await this.vectorIndex.upsert(id, embeddingResult.vector, {
        memoryId: id,
        archive_flag: updated.archive_flag,
        tags: updated.tags
      });
    }

    // Audit
    await this.auditService.append({
      event_type: 'memory_updated',
      memory_id: id,
      timestamp: new Date().toISOString(),
      details: { changelog }
    });

    return { ok: true, memory: updated, changelog };
  }

  /**
   * Extract canonical phrases from text
   */
  private static extractCanonicalPhrases(title: string, content: string): string[] {
    const phrases: string[] = [];

    // Add title as a phrase
    phrases.push(title.toLowerCase());

    // Extract key phrases from content (simple heuristic)
    const sentences = content.split(/[.!?]\s+/);
    for (const sentence of sentences.slice(0, 3)) {
      if (sentence.length > 10 && sentence.length < 100) {
        phrases.push(sentence.toLowerCase().trim());
      }
    }

    return phrases.slice(0, 6);
  }

  /**
   * Extract suggested tags from content
   */
  private static extractTags(content: string, existingTags: string[]): string[] {
    const suggested: string[] = [];

    // Common tech keywords
    const keywords = ['ui', 'api', 'database', 'test', 'bug', 'feature', 'performance', 'security'];
    const lowerContent = content.toLowerCase();

    for (const keyword of keywords) {
      if (lowerContent.includes(keyword) && !existingTags.includes(keyword)) {
        suggested.push(keyword);
      }
    }

    return suggested.slice(0, 4);
  }
}
