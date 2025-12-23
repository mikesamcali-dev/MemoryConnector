export declare const AI_COST_CONFIG: {
    perUserDailyEmbeddings: number;
    perUserDailyClassifications: number;
    globalDailyBudgetCents: number;
    alertThresholds: number[];
    circuitBreakerEnabled: boolean;
    fallbackMode: "queue" | "skip" | "local-only";
    costs: {
        embedding: number;
        classification: number;
        searchQuery: number;
    };
};
//# sourceMappingURL=ai-cost.config.d.ts.map