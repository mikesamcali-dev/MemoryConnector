import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { UsageLimitGuard } from './usage.guard';
import { UsageController } from './usage.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsageService, UsageLimitGuard],
  controllers: [UsageController],
  exports: [UsageService, UsageLimitGuard],
})
export class UsageModule {}
