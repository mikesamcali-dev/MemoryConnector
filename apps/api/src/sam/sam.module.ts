import { Module } from '@nestjs/common';
import { SamController } from './sam.controller';
import { SamService } from './sam.service';
import { SamRetrievalService } from './sam-retrieval.service';
import { SamTrainingService } from './sam-training.service';
import { SamAuditService } from './sam-audit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [PrismaModule, EmbeddingsModule],
  controllers: [SamController],
  providers: [
    SamService,
    SamRetrievalService,
    SamTrainingService,
    SamAuditService
  ],
  exports: [SamService, SamRetrievalService]
})
export class SamModule {}
