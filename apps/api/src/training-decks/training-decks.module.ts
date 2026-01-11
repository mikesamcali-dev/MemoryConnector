import { Module } from '@nestjs/common';
import { TrainingDecksController } from './training-decks.controller';
import { TrainingDecksService } from './training-decks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrainingDecksController],
  providers: [TrainingDecksService],
  exports: [TrainingDecksService],
})
export class TrainingDecksModule {}
