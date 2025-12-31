import { Module } from '@nestjs/common';
import { SlideDecksController } from './slidedecks.controller';
import { SlideDecksService } from './slidedecks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SlideDecksController],
  providers: [SlideDecksService],
  exports: [SlideDecksService],
})
export class SlideDecksModule {}
