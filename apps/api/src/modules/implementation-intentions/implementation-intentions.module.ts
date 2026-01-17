import { Module } from '@nestjs/common';
import { ImplementationIntentionsController } from './implementation-intentions.controller';
import { ImplementationIntentionsService } from './implementation-intentions.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImplementationIntentionsController],
  providers: [ImplementationIntentionsService],
  exports: [ImplementationIntentionsService],
})
export class ImplementationIntentionsModule {}
