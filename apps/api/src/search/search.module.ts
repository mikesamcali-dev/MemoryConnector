import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsageModule } from '../usage/usage.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [PrismaModule, UsageModule, EmbeddingsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

