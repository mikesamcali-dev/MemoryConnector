import { Module } from '@nestjs/common';
import { MemoriesController } from './memories.controller';
import { MemoriesService } from './memories.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsageModule } from '../usage/usage.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { DuplicateDetectionModule } from '../duplicate-detection/duplicate-detection.module';

@Module({
  imports: [PrismaModule, UsageModule, EnrichmentModule, DuplicateDetectionModule],
  controllers: [MemoriesController],
  providers: [MemoriesService],
  exports: [MemoriesService],
})
export class MemoriesModule {}

