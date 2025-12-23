import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiCircuitBreakerModule } from '../ai-circuit-breaker/ai-circuit-breaker.module';

@Module({
  imports: [PrismaModule, AiCircuitBreakerModule],
  providers: [EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}

