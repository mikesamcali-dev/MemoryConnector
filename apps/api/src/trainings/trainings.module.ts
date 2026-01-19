import { Module } from '@nestjs/common';
import { TrainingsController } from './trainings.controller';
import { TrainingsService } from './trainings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TrainingDecksModule } from '../training-decks/training-decks.module';

@Module({
  imports: [PrismaModule, TrainingDecksModule],
  controllers: [TrainingsController],
  providers: [TrainingsService],
  exports: [TrainingsService],
})
export class TrainingsModule {}
