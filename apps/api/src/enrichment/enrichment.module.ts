import { Module } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentQueueService } from './enrichment-queue.service';
import { AiCircuitBreakerModule } from '../ai-circuit-breaker/ai-circuit-breaker.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [AiCircuitBreakerModule, PrismaModule, RedisModule, EmbeddingsModule],
  providers: [EnrichmentService, EnrichmentQueueService],
  exports: [EnrichmentService, EnrichmentQueueService],
})
export class EnrichmentModule {}

