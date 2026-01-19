/**
 * SAM (Semantic Anchor Memory) Main Export
 */

// Types
export * from './domain/types';

// Domain Logic
export { normalizeText, normalizeCanonicalPhrase, normalizeForStorage } from './domain/normalize';
export { redactPII, redactMemoryDraft } from './domain/redact';
export {
  buildQueryText,
  exactMatchScore,
  recencyScore,
  compositeScore,
  buildRationale,
  makeHighlights,
  calculateEffectiveConfidence,
  round3,
  detectConflict
} from './domain/scoring';

// Services
export { MemoryService } from './services/MemoryService';
export { RetrievalService } from './services/RetrievalService';
export { TrainingService } from './services/TrainingService';
export { AuditService } from './services/AuditService';

// Repository & Infrastructure
export { IMemoryRepo, InMemoryRepo, type MemoryFilter } from './repo/MemoryRepo';
export { IVectorIndex, MockVectorIndex, type VectorSearchHit, type VectorMetadata } from './vector/VectorIndex';
export {
  IEmbeddingsService,
  MockEmbeddingsService,
  MemoryConnectorEmbeddingsAdapter,
  type EmbeddingResult
} from './embeddings/Embeddings';

// UI Components (React)
export { MemoryCreateForm } from './ui/MemoryCreateForm';
export { MicroTrainPanel } from './ui/MicroTrainPanel';
export { MemoryList } from './ui/MemoryList';
export { RecallInspector } from './ui/RecallInspector';
export { AuditTimeline } from './ui/AuditTimeline';
