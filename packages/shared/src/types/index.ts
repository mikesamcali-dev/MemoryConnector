// Shared types will be added as we build the application
export type UserTier = 'free' | 'premium';

export type MemoryType = 'note' | 'person' | 'event' | 'place' | 'task';

export type MemoryState = 'SAVED' | 'DRAFT' | 'DELETED';

export type EnrichmentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'queued_budget';

export type ReminderStatus = 'pending' | 'sent' | 'cancelled';

export type CircuitState = 'closed' | 'open' | 'queue';

export type SearchMethod = 'semantic' | 'keyword';

