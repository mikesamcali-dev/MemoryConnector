import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsArray,
  IsOptional,
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

export class UpdateProfileDto {
  @ApiPropertyOptional({
    enum: LearningStyle,
    description: 'How the user learns best',
  })
  @IsOptional()
  @IsEnum(LearningStyle)
  learningStyle?: LearningStyle;

  @ApiPropertyOptional({
    enum: SkillLevel,
    description: 'User experience level with memory techniques',
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  @ApiPropertyOptional({
    enum: PrimaryGoal,
    description: 'Main goal with Memory Connector',
  })
  @IsOptional()
  @IsEnum(PrimaryGoal)
  primaryGoal?: PrimaryGoal;

  @ApiPropertyOptional({
    description: 'Daily time commitment in minutes',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  dailyTimeCommitment?: number;

  @ApiPropertyOptional({
    enum: PreferredPace,
    description: 'Preferred learning pace',
  })
  @IsOptional()
  @IsEnum(PreferredPace)
  preferredPace?: PreferredPace;

  @ApiPropertyOptional({
    description: 'Best time of day to review',
    example: 'morning',
  })
  @IsOptional()
  @IsString()
  preferredReviewTime?: string;

  @ApiPropertyOptional({
    description: 'Areas of interest',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasOfInterest?: string[];

  @ApiPropertyOptional({
    description: 'Extended cognitive preferences',
  })
  @IsOptional()
  @IsObject()
  cognitivePreferences?: Record<string, any>;
}
