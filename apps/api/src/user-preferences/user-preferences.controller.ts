import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserPreferencesService } from './user-preferences.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('user-preferences')
@Controller('user-preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get('reminders')
  @ApiOperation({ summary: 'Get user reminder preferences' })
  async getReminderPreferences(@User() user: any) {
    return this.userPreferencesService.getReminderPreferences(user.id);
  }

  @Put('reminders')
  @ApiOperation({ summary: 'Update user reminder preferences' })
  async updateReminderPreferences(
    @User() user: any,
    @Body() body: {
      firstReminderMinutes?: number;
      secondReminderMinutes?: number;
      thirdReminderMinutes?: number;
      remindersEnabled?: boolean;
    }
  ) {
    return this.userPreferencesService.updateReminderPreferences(user.id, body);
  }
}
