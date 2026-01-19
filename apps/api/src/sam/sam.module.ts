import { Module } from '@nestjs/common';
import { SamController } from './sam.controller';
import { SamReviewController } from './sam-review.controller';
import { SamService } from './sam.service';
import { SamRetrievalService } from './sam-retrieval.service';
import { SamTrainingService } from './sam-training.service';
import { SamAuditService } from './sam-audit.service';
import { SamReviewSchedulingService } from './sam-review-scheduling.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [PrismaModule, EmbeddingsModule],
  controllers: [SamController, SamReviewController],
  providers: [
    SamService,
    SamRetrievalService,
    SamTrainingService,
    SamAuditService,
    SamReviewSchedulingService
  ],
  exports: [SamService, SamRetrievalService, SamReviewSchedulingService]
})
export class SamModule {}
