import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SamReviewSchedulingService } from './sam-review-scheduling.service';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

// DTOs
export class RecordReviewDto {
  @IsBoolean()
  wasSuccessful: boolean;

  @IsEnum(['recognition', 'free_recall'])
  reviewType: 'recognition' | 'free_recall';

  @IsOptional()
  @IsInt()
  @Min(0)
  responseTimeMs?: number;
}

@ApiTags('sam-reviews')
@Controller('sam/reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SamReviewController {
  constructor(private reviewService: SamReviewSchedulingService) {}

  @Get('due')
  @ApiOperation({ summary: 'Get due reviews for the current user' })
  @ApiResponse({ status: 200, description: 'List of due reviews' })
  async getDueReviews(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    const limitNumber = limit ? parseInt(limit, 10) : 20;
    return this.reviewService.getDueReviews(userId, limitNumber);
  }

  @Get('due/count')
  @ApiOperation({ summary: 'Get count of due reviews' })
  @ApiResponse({ status: 200, description: 'Count of due reviews' })
  async getDueReviewCount(@Req() req: any) {
    const userId = req.user.id;
    const count = await this.reviewService.getDueReviewCount(userId);
    return { count };
  }

  @Post(':scheduleId/record')
  @ApiOperation({ summary: 'Record a review attempt' })
  @ApiResponse({ status: 200, description: 'Review recorded' })
  async recordReview(
    @Req() req: any,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: RecordReviewDto,
  ) {
    return this.reviewService.recordReview(
      scheduleId,
      dto.wasSuccessful,
      dto.reviewType,
      dto.responseTimeMs,
    );
  }

  @Put(':scheduleId/pause')
  @ApiOperation({ summary: 'Pause a review schedule' })
  @ApiResponse({ status: 200, description: 'Schedule paused' })
  async pauseSchedule(
    @Req() req: any,
    @Param('scheduleId') scheduleId: string,
  ) {
    await this.reviewService.pauseSchedule(scheduleId);
    return { success: true };
  }

  @Put(':scheduleId/resume')
  @ApiOperation({ summary: 'Resume a paused review schedule' })
  @ApiResponse({ status: 200, description: 'Schedule resumed' })
  async resumeSchedule(
    @Req() req: any,
    @Param('scheduleId') scheduleId: string,
  ) {
    await this.reviewService.resumeSchedule(scheduleId);
    return { success: true };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiResponse({ status: 200, description: 'Review statistics' })
  async getReviewStats(@Req() req: any) {
    const userId = req.user.id;
    return this.reviewService.getReviewStats(userId);
  }
}
