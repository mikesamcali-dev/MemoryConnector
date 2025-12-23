import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { UsageLimitGuard } from './usage.guard';
import { UsageController } from './usage.controller';

@Module({
  providers: [UsageService, UsageLimitGuard],
  controllers: [UsageController],
  exports: [UsageService, UsageLimitGuard],
})
export class UsageModule {}
