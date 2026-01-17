import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsArray,
  IsOptional,
  IsBoolean,
  IsString,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import {
  LearningStyle,
  SkillLevel,
  PrimaryGoal,
  PreferredPace,
} from '@prisma/client';

export class OnboardingAnswersDto {
  @ApiProperty({
    enum: LearningStyle,
    description: 'How the user learns best',
    example: LearningStyle.VISUAL,
  })
  @IsEnum(LearningStyle)
  learningStyle: LearningStyle;

  @ApiProperty({
    enum: SkillLevel,
    description: 'User experience level with memory techniques',
    example: SkillLevel.INTERMEDIATE,
  })
  @IsEnum(SkillLevel)
  skillLevel: SkillLevel;

  @ApiProperty({
    enum: PrimaryGoal,
    description: 'Main goal with Memory Connector',
    example: PrimaryGoal.RETENTION,
  })
  @IsEnum(PrimaryGoal)
  primaryGoal: PrimaryGoal;

  @ApiProperty({
    description: 'Daily time commitment in minutes',
    example: 10,
    enum: [5, 10, 15, 30, 60],
  })
  @IsInt()
  @Min(5)
  @Max(120)
  dailyTimeCommitment: number;

  @ApiProperty({
    enum: PreferredPace,
    description: 'Preferred learning pace',
    example: PreferredPace.MODERATE,
  })
  @IsEnum(PreferredPace)
  preferredPace: PreferredPace;

  @ApiPropertyOptional({
    description: 'Best time of day to review',
    example: 'morning',
    enum: ['morning', 'afternoon', 'evening', 'flexible'],
  })
  @IsOptional()
  @IsString()
  preferredReviewTime?: string;

  @ApiPropertyOptional({
    description: 'Areas of interest',
    type: [String],
    example: ['People & Relationships', 'Work & Professional'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasOfInterest?: string[];

  @ApiPropertyOptional({
    description: 'Enable context-aware reminders',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableReminders?: boolean;

  @ApiPropertyOptional({
    description: 'Prefer recognition-based recall',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  preferRecognition?: boolean;

  @ApiPropertyOptional({
    description: 'Difficulty tolerance (1-5)',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyTolerance?: number;

  @ApiPropertyOptional({
    description: 'Show extra context during reviews',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showContext?: boolean;

  @ApiPropertyOptional({
    description: 'Enable haptic feedback (mobile)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableHapticFeedback?: boolean;

  @ApiPropertyOptional({
    description: 'Extended cognitive preferences',
    example: {},
  })
  @IsOptional()
  @IsObject()
  cognitivePreferences?: Record<string, any>;
}
