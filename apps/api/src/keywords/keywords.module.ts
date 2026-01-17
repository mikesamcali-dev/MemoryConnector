import { Module } from '@nestjs/common';
import { KeywordExpansionService } from './keyword-expansion.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [KeywordExpansionService],
  exports: [KeywordExpansionService],
})
export class KeywordsModule {}
