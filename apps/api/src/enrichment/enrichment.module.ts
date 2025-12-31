import { Module } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentQueueService } from './enrichment-queue.service';
import { EnrichmentProcessor } from './enrichment.processor';
import { EnrichmentWorker } from './enrichment.worker';
import { LLMExtractionService } from './llm-extraction.service';
import { EntityProcessorService } from './entity-processor.service';
import { AiCircuitBreakerModule } from '../ai-circuit-breaker/ai-circuit-breaker.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { WordsModule } from '../words/words.module';

@Module({
  imports: [AiCircuitBreakerModule, PrismaModule, RedisModule, EmbeddingsModule, WordsModule],
  providers: [
    EnrichmentService,
    EnrichmentQueueService,
    EnrichmentProcessor,
    EnrichmentWorker,
    LLMExtractionService,
    EntityProcessorService,
  ],
  exports: [EnrichmentService, EnrichmentQueueService, EnrichmentWorker, LLMExtractionService],
})
export class EnrichmentModule {}

