import { Module } from '@nestjs/common';
import { YouTubeVideosController } from './youtube-videos.controller';
import { YouTubeVideosService } from './youtube-videos.service';
import { YouTubeMetadataService } from './youtube-metadata.service';
import { YouTubeEnrichmentService } from './youtube-enrichment.service';
import { R2StorageService } from './r2-storage.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YouTubeVideosController],
  providers: [YouTubeVideosService, YouTubeMetadataService, YouTubeEnrichmentService, R2StorageService],
  exports: [YouTubeVideosService],
})
export class YouTubeVideosModule {}
