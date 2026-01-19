/**
 * SAM (Semantic Anchor Memory) Core Type Definitions
 */

export type SourceType = 'user' | 'system' | 'import' | 'derived' | 'doc';
export type ReliabilityLevel = 'unverified' | 'inferred' | 'confirmed' | 'contested';
export type DecayPolicyType = 'exponential' | 'none';

export interface SamSource {
  type: SourceType;
  ref: string;
  uri: string | null;
}

export interface SamContextWindow {
  applies_to: string[];
  excludes: string[];
}

export interface SamTrainingExample {
  id: string;
  user: string;
  assistant: string;
  assertions: string[];
  last_tested_at: string | null;
  pass_rate: number;
}

export interface SamDecayPolicy {
  type: DecayPolicyType;
  half_life_days: number;
  min_confidence: number;
}

export interface SamEmbeddings {
  model: string;
  dims: number;
  vector_ref: string;
}

export interface SamMemoryEntry {
  id: string;
  title: string;
  content: string;
  summary: string;
  canonical_phrases: string[];
  tags: string[];
  source: SamSource;
  created_at: string;
  updated_at: string;
  confidence_score: number;
  reliability: ReliabilityLevel;
  usage_count: number;
  last_used_at: string | null;
  context_window: SamContextWindow;
  training_examples: SamTrainingExample[];
  decay_policy: SamDecayPolicy;
  archive_flag: boolean;
  version: number;
  embeddings: SamEmbeddings;
}

export interface SamMemoryDraft {
  title: string;
  content: string;
  tags: string[];
  reliability: ReliabilityLevel;
  confidence_score: number;
  context_window: SamContextWindow;
  decay_policy: SamDecayPolicy;
  source: SamSource;
  training_examples?: SamTrainingExample[];
}

export interface SamEnrichmentPreview {
  summary: string;
  canonical_phrases: string[];
  suggested_tags: string[];
  pii_warnings: string[];
  embedding_ready: boolean;
}

export interface RedactionItem {
  path: string;
  pattern: string;
  redacted_text: string;
}

export interface RedactionReport {
  items: RedactionItem[];
  total_count: number;
}

export interface ScoringSignals {
  semantic: number;
  exact: number;
  recency: number;
  confidence: number;
}

export interface ScoringWeights {
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

export interface RecallConfig {
  embedding_model: string;
  vector_top_k: number;
  similarity_threshold: number;
  composite_score_min: number;
  recency_window_days: number;
  weights: ScoringWeights;
  recall_top_n: number;
  rerank_top_n: number;
}

export interface ConversationTurn {
  speaker: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface UIState {
  route?: string;
  selection?: string;
  filters?: Record<string, any>;
  security_context?: {
    allowlist?: string[];
  };
}

export interface MemoryStoreSnapshot {
  total_count: number;
  tags: string[];
  last_indexed_at?: string;
  vector_index?: {
    provider: string;
    dims: number;
  };
}

export interface RecallContext {
  current_conversation: ConversationTurn[];
  active_task: string;
  ui_state: UIState;
  memory_store_snapshot?: MemoryStoreSnapshot;
}

export interface SuggestedAction {
  type: string;
  label: string;
  payload: Record<string, any>;
}

export interface RecallResult {
  action: string;
  ok: boolean;
  ui_summary: {
    message: string;
    next_steps?: string[];
  };
  redaction_report: RedactionReport;
  data: {
    ranked_memory_list?: RankedMemory[];
    suggested_follow_up_actions?: SuggestedAction[];
    prefill?: Partial<SamMemoryDraft>;
  };
}

export interface ChangelogDiff {
  path: string;
  before: any;
  after: any;
  reason: string;
}

export interface CreateResult {
  action: 'create';
  ok: boolean;
  ui_summary: {
    message: string;
    next_steps?: string[];
  };
  redaction_report: RedactionReport;
  data: {
    memory: SamMemoryEntry;
    suggested_training_examples: SamTrainingExample[];
    embedding_hint: {
      model: string;
      dims: number;
      text_hash: string;
    };
    ui_payload: Record<string, any>;
  };
}

export const DEFAULT_SAM_CONFIG: RecallConfig = {
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

export const DEFAULT_DECAY_POLICY: SamDecayPolicy = {
  type: 'exponential',
  half_life_days: 90,
  min_confidence: 0.40
};
