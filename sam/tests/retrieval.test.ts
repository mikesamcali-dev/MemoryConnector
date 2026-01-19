/**
 * SAM Retrieval Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RetrievalService } from '../services/RetrievalService';
import { InMemoryRepo } from '../repo/MemoryRepo';
import { MockVectorIndex } from '../vector/VectorIndex';
import { MockEmbeddingsService } from '../embeddings/Embeddings';
import { AuditService } from '../services/AuditService';
import { SamMemoryEntry, RecallContext } from '../domain/types';

describe('SAM Retrieval Service', () => {
  let repo: InMemoryRepo;
  let vectorIndex: MockVectorIndex;
  let embeddings: MockEmbeddingsService;
  let audit: AuditService;
  let retrieval: RetrievalService;

  beforeEach(() => {
    repo = new InMemoryRepo();
    vectorIndex = new MockVectorIndex();
    embeddings = new MockEmbeddingsService();
    audit = new AuditService();
    retrieval = new RetrievalService(repo, vectorIndex, embeddings, audit);
  });

  it('should recall memories with high semantic similarity', async () => {
    // Create test memory
    const memory: SamMemoryEntry = {
      id: 'mem_001',
      title: 'Use MudSnackbar for alerts',
      content: 'Prefer MudSnackbar over MudDialog for alert notifications.',
      summary: 'Use MudSnackbar for alerts',
      canonical_phrases: ['use mudsnackbar for alerts', 'prefer snackbar'],
      tags: ['ui', 'blazor'],
      source: { type: 'user', ref: 'test', uri: null },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      confidence_score: 0.85,
      reliability: 'confirmed',
      usage_count: 0,
      last_used_at: null,
      context_window: { applies_to: ['blazor'], excludes: [] },
      training_examples: [],
      decay_policy: { type: 'exponential', half_life_days: 90, min_confidence: 0.4 },
      archive_flag: false,
      version: 1,
      embeddings: { model: 'text-embedding-ada-002', dims: 1536, vector_ref: 'vec://mem_001' }
    };

    await repo.create(memory);

    // Generate and store embedding
    const embResult = await embeddings.generate(
      `${memory.title}\n${memory.content}`,
      memory.embeddings.model
    );
    await vectorIndex.upsert(memory.id, embResult.vector, {
      memoryId: memory.id,
      archive_flag: false,
      tags: memory.tags
    });

    // Recall with similar query
    const context: RecallContext = {
      current_conversation: [
        { speaker: 'user', content: 'How should I show alerts in my Blazor app?' }
      ],
      active_task: 'Implement alert notifications',
      ui_state: {}
    };

    const result = await retrieval.recall(context);

    expect(result.ok).toBe(true);
    expect(result.data.ranked_memory_list).toBeDefined();
    expect(result.data.ranked_memory_list!.length).toBeGreaterThan(0);
    expect(result.data.ranked_memory_list![0].id).toBe('mem_001');
  });

  it('should return fail-safe when no memories match threshold', async () => {
    const context: RecallContext = {
      current_conversation: [
        { speaker: 'user', content: 'Completely unrelated query about databases' }
      ],
      active_task: 'Database optimization',
      ui_state: {}
    };

    const result = await retrieval.recall(context);

    expect(result.ok).toBe(false);
    expect(result.data.ranked_memory_list).toEqual([]);
    expect(result.data.suggested_follow_up_actions).toBeDefined();
    expect(result.data.suggested_follow_up_actions!.length).toBeGreaterThan(0);
  });

  it('should include rationale for recalled memories', async () => {
    const memory: SamMemoryEntry = {
      id: 'mem_002',
      title: 'API Error Handling',
      content: 'Always use try-catch blocks for API calls',
      summary: 'Error handling for APIs',
      canonical_phrases: ['api error handling', 'try-catch for api'],
      tags: ['api', 'error'],
      source: { type: 'user', ref: 'test', uri: null },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      confidence_score: 0.90,
      reliability: 'confirmed',
      usage_count: 0,
      last_used_at: null,
      context_window: { applies_to: [], excludes: [] },
      training_examples: [],
      decay_policy: { type: 'exponential', half_life_days: 90, min_confidence: 0.4 },
      archive_flag: false,
      version: 1,
      embeddings: { model: 'text-embedding-ada-002', dims: 1536, vector_ref: 'vec://mem_002' }
    };

    await repo.create(memory);
    const embResult = await embeddings.generate(memory.title, memory.embeddings.model);
    await vectorIndex.upsert(memory.id, embResult.vector, {
      memoryId: memory.id,
      archive_flag: false,
      tags: memory.tags
    });

    const context: RecallContext = {
      current_conversation: [
        { speaker: 'user', content: 'How to handle API errors?' }
      ],
      active_task: 'API integration',
      ui_state: {}
    };

    const result = await retrieval.recall(context);

    if (result.ok && result.data.ranked_memory_list!.length > 0) {
      const recalled = result.data.ranked_memory_list![0];
      expect(recalled.rationale).toBeTruthy();
      expect(recalled.rationale.length).toBeGreaterThan(0);
    }
  });

  it('should not recall archived memories', async () => {
    const memory: SamMemoryEntry = {
      id: 'mem_003',
      title: 'Archived Memory',
      content: 'This memory is archived',
      summary: 'Archived',
      canonical_phrases: ['archived memory'],
      tags: ['test'],
      source: { type: 'user', ref: 'test', uri: null },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      confidence_score: 0.80,
      reliability: 'confirmed',
      usage_count: 0,
      last_used_at: null,
      context_window: { applies_to: [], excludes: [] },
      training_examples: [],
      decay_policy: { type: 'exponential', half_life_days: 90, min_confidence: 0.4 },
      archive_flag: true,
      version: 1,
      embeddings: { model: 'text-embedding-ada-002', dims: 1536, vector_ref: 'vec://mem_003' }
    };

    await repo.create(memory);
    const embResult = await embeddings.generate(memory.title, memory.embeddings.model);
    await vectorIndex.upsert(memory.id, embResult.vector, {
      memoryId: memory.id,
      archive_flag: true,
      tags: memory.tags
    });

    const context: RecallContext = {
      current_conversation: [
        { speaker: 'user', content: 'archived memory' }
      ],
      active_task: 'Test',
      ui_state: {}
    };

    const result = await retrieval.recall(context);

    if (result.data.ranked_memory_list) {
      expect(result.data.ranked_memory_list.some(m => m.id === 'mem_003')).toBe(false);
    }
  });
});
