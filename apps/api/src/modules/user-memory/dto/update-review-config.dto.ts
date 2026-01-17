import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class UpdateReviewConfigDto {
  @ApiPropertyOptional({
    description: 'Maximum reviews per session',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(50)
  maxReviewsPerSession?: number;

  @ApiPropertyOptional({
    description: 'Prefer recognition-based recall over free recall',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  preferRecognition?: boolean;

  @ApiPropertyOptional({
    description: 'Show context (location, person, date) during reviews',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showContext?: boolean;

  @ApiPropertyOptional({
    description: 'Enable haptic feedback on mobile',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enableHapticFeedback?: boolean;

  @ApiPropertyOptional({
    description: 'Enable adaptive scheduling',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  adaptiveScheduling?: boolean;

  @ApiPropertyOptional({
    description: 'Interval multiplier (0.5-2.0)',
    example: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  intervalMultiplier?: number;

  @ApiPropertyOptional({
    description: 'Difficulty threshold (0.5-1.0)',
    example: 0.8,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(1.0)
  difficultyThreshold?: number;

  @ApiPropertyOptional({
    description: 'Maximum interval in days',
    example: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(90)
  maxInterval?: number;
}
