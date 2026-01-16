import { Module } from '@nestjs/common';
import { HelpViewsController } from './help-views.controller';
import { HelpViewsService } from './help-views.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HelpViewsController],
  providers: [HelpViewsService],
  exports: [HelpViewsService],
})
export class HelpViewsModule {}
