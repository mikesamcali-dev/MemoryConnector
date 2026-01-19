# Semantic Anchor Memory (SAM) System

A robust, structured memory system for Memory Connector that replaces the existing "slides + training phrases" approach with semantic anchoring, hybrid retrieval, micro-training, and explainable recall.

## Overview

SAM provides:
- **Structured Memory Storage** with rich metadata and versioning
- **Hybrid Retrieval** combining vector similarity, exact matches, recency, and confidence
- **Micro-Training** with interactive validation and testing
- **Explainable Recall** with detailed rationales for why memories are recalled
- **PII Redaction** for safe storage
- **Decay Policies** for confidence scoring over time
- **Audit Trail** for all memory operations

## Architecture

```
sam/
├── schema/              # JSON schema definitions
├── domain/              # Core types and logic (normalize, redact, scoring)
├── repo/                # Repository pattern for storage
├── vector/              # Vector index abstraction
├── embeddings/          # Embeddings service
├── services/            # Business logic (Memory, Retrieval, Training, Audit)
├── ui/                  # React components
└── tests/               # Comprehensive test suite
```

## Core Concepts

### Memory Entry Structure

Each SAM memory includes:
- **Core Data**: title, content, summary
- **Semantic Anchors**: canonical_phrases (lowercased, normalized)
- **Metadata**: tags, source, confidence_score, reliability
- **Context**: applies_to, excludes filters
- **Training**: micro-training examples with assertions
- **Decay**: exponential decay policy for confidence
- **Audit**: version history and changelog

### Retrieval Pipeline

1. **Query Building**: Combine conversation history + active task + UI state
2. **Vector Search**: Semantic similarity using embeddings
3. **Exact Matching**: Check canonical phrase hits
4. **Composite Scoring**: Weighted combination of:
   - Semantic similarity (50%)
   - Exact matches (20%)
   - Recency (15%)
   - Confidence (15%)
5. **Reranking**: Top candidates with rationale generation
6. **Fail-Safe**: Suggest creating new memory if no matches

### Micro-Training

Each memory can have 1-6 training examples:
- **User Prompt**: Realistic trigger scenario
- **Expected Response**: How memory should be applied
- **Assertions**: Required keywords or `forbidden:term` constraints
- **Pass Rate**: Tracked over test runs

## Usage

### Creating a Memory

```typescript
import { MemoryService } from './services/MemoryService';
import { SamMemoryDraft } from './domain/types';

const draft: SamMemoryDraft = {
  title: 'Use MudSnackbar for alerts',
  content: 'Prefer MudSnackbar over MudDialog for alert-style notifications in Blazor UI.',
  tags: ['ui', 'blazor', 'mudblazor'],
  reliability: 'confirmed',
  confidence_score: 0.85,
  context_window: { applies_to: ['blazor'], excludes: [] },
  decay_policy: { type: 'exponential', half_life_days: 90, min_confidence: 0.4 },
  source: { type: 'user', ref: 'cursor_ui', uri: null }
};

const result = await memoryService.createFromDraft({ draft, preview });
```

### Recalling Memories

```typescript
import { RetrievalService } from './services/RetrievalService';

const context = {
  current_conversation: [
    { speaker: 'user', content: 'How should I show alerts?' }
  ],
  active_task: 'Implement notifications',
  ui_state: { route: 'editor' }
};

const result = await retrievalService.recall(context);

if (result.ok) {
  result.data.ranked_memory_list.forEach(memory => {
    console.log(`${memory.title} (${memory.score})`);
    console.log(`Rationale: ${memory.rationale}`);
  });
}
```

### UI Components

```tsx
import { MemoryCreateForm } from './ui/MemoryCreateForm';
import { RecallInspector } from './ui/RecallInspector';
import { MicroTrainPanel } from './ui/MicroTrainPanel';

// Create new memory
<MemoryCreateForm
  onSaved={(entry) => console.log('Created:', entry)}
  onCancel={() => console.log('Cancelled')}
/>

// Show recalled memories
<RecallInspector
  memories={rankedMemories}
  onApply={(id) => applyMemory(id)}
/>

// Edit training examples
<MicroTrainPanel
  examples={memory.training_examples}
  onChange={(updated) => setExamples(updated)}
  onRunTests={async () => await runTests()}
/>
```

## Configuration

Default configuration in `domain/types.ts`:

```typescript
const DEFAULT_SAM_CONFIG = {
  embedding_model: 'text-embedding-ada-002',
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
  recall_top_n: 5,
  rerank_top_n: 7
};
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Type checking
npm run typecheck
```

### Test Coverage

- Schema validation tests
- PII redaction tests
- Text normalization tests
- Scoring logic tests
- Retrieval pipeline tests
- Micro-training tests
- End-to-end recall tests

## Integration with Memory Connector

### Embeddings Integration

Currently uses mock embeddings. To integrate with existing Memory Connector embeddings:

```typescript
// In embeddings/Embeddings.ts
import { EmbeddingsService } from '../../apps/api/src/embeddings/embeddings.service';

export class MemoryConnectorEmbeddingsAdapter implements IEmbeddingsService {
  constructor(private embeddingsService: EmbeddingsService) {}

  async generate(text: string, model: string): Promise<EmbeddingResult> {
    const result = await this.embeddingsService.generateEmbedding(text);
    return {
      vector: result.embedding,
      dims: result.embedding.length,
      model,
      text_hash: this.hashText(text)
    };
  }
}
```

### Vector Storage Integration

To integrate with existing pgvector:

```typescript
// Create adapter for partitioned embeddings tables
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';

export class PgVectorAdapter implements IVectorIndex {
  constructor(private prisma: PrismaService) {}

  async upsert(id: string, vector: number[], metadata: VectorMetadata) {
    const partition = this.getPartition(id);
    await this.prisma.$executeRaw`
      INSERT INTO embeddings_partition_${partition} (id, vector, metadata)
      VALUES (${id}, ${vector}, ${metadata})
      ON CONFLICT (id) DO UPDATE SET vector = ${vector}, metadata = ${metadata}
    `;
  }
}
```

## PII Protection

All memory content is automatically scanned and redacted:
- Email addresses → `[email]`
- Phone numbers → `[phone]`
- Street addresses → `[address]`
- API keys/secrets → `[secret]`

Redaction report is included in all operations.

## Versioning and Audit

Every memory update:
1. Increments version number
2. Creates changelog diff
3. Stores version in history
4. Appends audit event

Query audit timeline:
```typescript
const events = await auditService.getHistory('mem_123');
```

## Decay and Archival

Memories decay over time based on policy:
```typescript
effective_confidence = base_confidence * (0.5 ^ (days_since_update / half_life_days))
```

When effective confidence drops below `min_confidence`, memory is auto-suggested for archival.

## Conflict Detection

SAM automatically detects conflicting memories:
- Shared tags but contradictory canonical phrases
- Flags conflicts in recall results
- Suggests resolution workflow

## Next Steps

1. **Integration**: Wire up to existing Memory Connector backend
2. **UI Polish**: Add styling and animations
3. **Performance**: Optimize vector search and caching
4. **Migration**: Tool to convert existing memories to SAM format
5. **Admin UI**: Batch operations and analytics dashboard

## License

Part of Memory Connector project.
