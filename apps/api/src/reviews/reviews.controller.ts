import { Controller, Get, Post, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { ReviewsService } from './reviews.service';
import { SubmitReviewDto } from './dto/submit-review.dto';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('due')
  @ApiOperation({ summary: 'Get memories due for review' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDueReviews(
    @User() user: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewsService.getDueReviews(user.id, limit || 20);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics for current user' })
  async getStats(@User() user: any) {
    return this.reviewsService.getReviewStats(user.id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get count of reviews due today' })
  async getDueCount(@User() user: any) {
    const count = await this.reviewsService.getDueCount(user.id);
    return { count };
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit a review rating for a memory' })
  async submitReview(@User() user: any, @Body() dto: SubmitReviewDto) {
    return this.reviewsService.submitReview(user.id, dto.memoryId, dto.rating);
  }
}
