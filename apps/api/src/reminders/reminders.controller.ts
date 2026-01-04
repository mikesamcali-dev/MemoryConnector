import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
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

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming reminders' })
  async getUpcoming(@User() user: any) {
    return this.remindersService.getUpcoming(user.id, 5);
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

  @Get('memory/:memoryId')
  @ApiOperation({ summary: 'Get all reminders for a specific memory' })
  async getForMemory(@Param('memoryId') memoryId: string, @User() user: any) {
    return this.remindersService.getForMemory(user.id, memoryId);
  }

  @Put(':id/schedule')
  @ApiOperation({ summary: 'Update reminder scheduled time' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() body: { scheduledAt: string },
    @User() user: any
  ) {
    const newScheduledAt = new Date(body.scheduledAt);
    return this.remindersService.updateScheduledTime(user.id, id, newScheduledAt);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reminder' })
  async delete(@Param('id') id: string, @User() user: any) {
    return this.remindersService.deleteReminder(user.id, id);
  }

  @Post('memory/:memoryId/srs')
  @ApiOperation({ summary: 'Create three SRS reminders for a memory based on user preferences' })
  async createSRSReminders(@Param('memoryId') memoryId: string, @User() user: any) {
    return this.remindersService.createSRSReminders(user.id, memoryId);
  }
}

