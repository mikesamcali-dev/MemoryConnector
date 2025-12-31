import { Module } from '@nestjs/common';
import { SpellCheckController } from './spell-check.controller';
import { SpellCheckService } from './spell-check.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SpellCheckController],
  providers: [SpellCheckService],
  exports: [SpellCheckService],
})
export class SpellCheckModule {}
