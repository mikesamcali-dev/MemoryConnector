import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { AlertingService } from '../alerting/alerting.service';
export declare enum CircuitState {
    CLOSED = "closed",
    OPEN = "open",
    QUEUE_ONLY = "queue"
}
export declare class CircuitBreakerService {
    private redis;
    private prisma;
    private alerting;
    private config;
    private readonly CIRCUIT_KEY;
    private readonly SPEND_KEY;
    constructor(redis: Redis, prisma: PrismaService, alerting: AlertingService, config: ConfigService);
    getCircuitState(): Promise<CircuitState>;
    setCircuitState(state: CircuitState, ttlSeconds?: number): Promise<void>;
    private getSecondsUntilMidnight;
    private getMidnightTimestamp;
    recordAICost(userId: string, operation: 'embedding' | 'classification' | 'search_query', tokens: number, costCents: number, model: string, memoryId?: string): Promise<void>;
    canProcessAI(userId: string): Promise<{
        allowed: boolean;
        reason?: string;
        circuitState: CircuitState;
    }>;
    getDailySpendSummary(): Promise<{
        totalCents: number;
        percentUsed: number;
        operationCount: number;
        circuitState: CircuitState;
    }>;
}
//# sourceMappingURL=circuit-breaker.service.d.ts.map