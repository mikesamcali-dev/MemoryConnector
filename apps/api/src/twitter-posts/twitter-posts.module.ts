import { Module } from '@nestjs/common';
import { TwitterPostsController } from './twitter-posts.controller';
import { TwitterPostsService } from './twitter-posts.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TwitterPostsController],
  providers: [TwitterPostsService],
  exports: [TwitterPostsService],
})
export class TwitterPostsModule {}
