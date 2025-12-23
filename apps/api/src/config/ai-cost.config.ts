export const AI_COST_CONFIG = {
  // Per-user daily limits (prevents runaway usage)
  perUserDailyEmbeddings: 100, // ~$0.002/day max per user
  perUserDailyClassifications: 50, // ~$0.375/day max per user

  // Global daily budget in cents
  globalDailyBudgetCents: 10000, // $100/day

  // Alert thresholds (percent of daily budget)
  alertThresholds: [50, 80, 100],

  // Circuit breaker: disable AI when budget exceeded
  circuitBreakerEnabled: true,

  // Fallback behavior when circuit open
  // 'queue' = accept saves, queue enrichment for later
  // 'skip' = save without enrichment
  // 'local-only' = use on-device classification only
  fallbackMode: 'queue' as 'queue' | 'skip' | 'local-only',

  // Cost per operation (in cents, for tracking)
  costs: {
    embedding: 0.002, // ~200 tokens × $0.0001/1K
    classification: 0.75, // ~500 tokens × $0.015/1K (gpt-3.5-turbo)
    searchQuery: 0.0005, // ~50 tokens × $0.0001/1K
  },
};

