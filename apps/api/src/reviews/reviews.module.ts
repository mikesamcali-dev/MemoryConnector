import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserMemoryModule } from '../modules/user-memory/user-memory.module';

@Module({
  imports: [PrismaModule, UserMemoryModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
