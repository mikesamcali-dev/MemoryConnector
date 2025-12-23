import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { RemindersService } from './reminders.service';

@ApiTags('reminders')
@Controller('reminders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RemindersController {
  constructor(private remindersService: RemindersService) {}

  @Get('inbox')
  @ApiOperation({ summary: 'Get reminder inbox' })
  async getInbox(@User() user: any) {
    return this.remindersService.getInbox(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark reminder as read' })
  async markAsRead(@Param('id') id: string, @User() user: any) {
    return this.remindersService.markAsRead(user.id, id);
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss reminder' })
  async dismiss(@Param('id') id: string, @User() user: any) {
    return this.remindersService.dismiss(user.id, id);
  }
}

