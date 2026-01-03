import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Get('achievements')
  @ApiOperation({ summary: 'Get user achievements and progress' })
  async getAchievements(@User() user: any) {
    return this.gamificationService.getUserAchievements(user.id);
  }
}
