import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MemoryDecksController } from './memory-decks.controller';
import { MemoryDecksService } from './memory-decks.service';
import { MemoryDeckSchedulerService } from './memory-deck-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [MemoryDecksController],
  providers: [MemoryDecksService, MemoryDeckSchedulerService],
  exports: [MemoryDecksService],
})
export class MemoryDecksModule {}
