import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@Controller('usage')
@UseGuards(JwtAuthGuard)
export class UsageController {
  constructor(private usageService: UsageService) {}

  @Get()
  async getUsage(@User() user: any) {
    return this.usageService.getUserUsage(user.id);
  }
}
