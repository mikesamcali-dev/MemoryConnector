import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiCircuitBreakerModule } from '../ai-circuit-breaker/ai-circuit-breaker.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { WordsModule } from '../words/words.module';
import { EventsModule } from '../events/events.module';
import { LocationsModule } from '../locations/locations.module';
import { UserMemoryModule } from '../modules/user-memory/user-memory.module';

@Module({
  imports: [
    PrismaModule,
    AiCircuitBreakerModule,
    EnrichmentModule,
    WordsModule,
    EventsModule,
    LocationsModule,
    UserMemoryModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}

