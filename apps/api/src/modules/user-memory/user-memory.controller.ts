import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserMemoryService } from './user-memory.service';
import {
  OnboardingAnswersDto,
  UpdateProfileDto,
  UpdateReviewConfigDto,
  CheckInResponsesDto,
} from './dto';

@ApiTags('user-memory')
@Controller('user-memory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserMemoryController {
  constructor(private readonly userMemoryService: UserMemoryService) {}

  @Post('onboarding')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Complete onboarding and create user profile' })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid onboarding data',
  })
  async completeOnboarding(
    @Req() req: any,
    @Body() data: OnboardingAnswersDto,
  ) {
    const userId = req.user.id;
    return this.userMemoryService.createProfileFromOnboarding(userId, data);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user memory profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async getProfile(@Req() req: any) {
    const userId = req.user.id;
    return this.userMemoryService.getProfile(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user memory profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async updateProfile(@Req() req: any, @Body() data: UpdateProfileDto) {
    const userId = req.user.id;
    return this.userMemoryService.updateProfile(userId, data);
  }

  @Get('review-config')
  @ApiOperation({ summary: 'Get personalized review configuration' })
  @ApiResponse({
    status: 200,
    description: 'Review config retrieved successfully',
  })
  async getReviewConfig(@Req() req: any) {
    const userId = req.user.id;
    return this.userMemoryService.getPersonalizedReviewConfig(userId);
  }

  @Put('review-config')
  @ApiOperation({ summary: 'Update review configuration' })
  @ApiResponse({
    status: 200,
    description: 'Review config updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Review config not found',
  })
  async updateReviewConfig(
    @Req() req: any,
    @Body() data: UpdateReviewConfigDto,
  ) {
    const userId = req.user.id;
    return this.userMemoryService.updateReviewConfig(userId, data);
  }

  @Get('check-in-status')
  @ApiOperation({ summary: 'Check if profile refinement check-in is needed' })
  @ApiResponse({
    status: 200,
    description: 'Check-in status retrieved',
  })
  async getCheckInStatus(@Req() req: any) {
    const userId = req.user.id;
    return this.userMemoryService.shouldTriggerCheckIn(userId);
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit profile refinement check-in responses' })
  @ApiResponse({
    status: 200,
    description: 'Check-in processed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async submitCheckIn(@Req() req: any, @Body() data: CheckInResponsesDto) {
    const userId = req.user.id;
    return this.userMemoryService.processProfileCheckIn(userId, data);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get profile analytics and adaptation history' })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
  })
  async getAnalytics(@Req() req: any) {
    const userId = req.user.id;
    return this.userMemoryService.getProfileAnalytics(userId);
  }
}
