import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { TriggerType, Frequency } from '@prisma/client';

export class CreateIntentionDto {
  @ApiProperty({
    enum: TriggerType,
    description: 'Type of trigger',
    example: TriggerType.TIME,
  })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiProperty({
    description: 'Trigger value (e.g., "08:00" for TIME, "lat,lng" for LOCATION)',
    example: '08:00',
  })
  @IsString()
  triggerValue: string;

  @ApiProperty({
    description: 'Action to perform',
    example: 'Review today\'s memories',
  })
  @IsString()
  action: string;

  @ApiPropertyOptional({
    description: 'Custom if-then phrase (auto-generated if not provided)',
    example: 'If it\'s 8:00 AM, then I\'ll review today\'s memories',
  })
  @IsOptional()
  @IsString()
  ifThenPhrase?: string;

  @ApiPropertyOptional({
    enum: Frequency,
    description: 'How often to trigger',
    example: Frequency.DAILY,
  })
  @IsOptional()
  @IsEnum(Frequency)
  frequency?: Frequency;

  @ApiPropertyOptional({
    description: 'Custom days (0-6) for CUSTOM frequency',
    type: [Number],
    example: [1, 2, 3, 4, 5],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  customDays?: number[];

  @ApiPropertyOptional({
    description: 'Enable intention',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
