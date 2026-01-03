import { Module } from '@nestjs/common';
import { MemoriesController } from './memories.controller';
import { MemoriesService } from './memories.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsageModule } from '../usage/usage.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { DuplicateDetectionModule } from '../duplicate-detection/duplicate-detection.module';
import { GamificationModule } from '../gamification/gamification.module';
import { WordsModule } from '../words/words.module';
import { EventsModule } from '../events/events.module';
import { LocationsModule } from '../locations/locations.module';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';
import { SpellCheckModule } from '../spell-check/spell-check.module';

@Module({
  imports: [
    PrismaModule,
    UsageModule,
    EnrichmentModule,
    DuplicateDetectionModule,
    GamificationModule,
    WordsModule,
    EventsModule,
    LocationsModule,
    UserPreferencesModule,
    SpellCheckModule,
  ],
  controllers: [MemoriesController],
  providers: [MemoriesService],
  exports: [MemoriesService],
})
export class MemoriesModule {}

