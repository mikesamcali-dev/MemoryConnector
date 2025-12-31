import { Module } from '@nestjs/common';
import { TikTokVideosController } from './tiktok-videos.controller';
import { TikTokVideosService } from './tiktok-videos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TikTokVideosController],
  providers: [TikTokVideosService],
  exports: [TikTokVideosService],
})
export class TikTokVideosModule {}
