import { IsString, IsArray, IsNumber, IsEnum, IsOptional, IsBoolean, Min, Max, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SamReliability {
  unverified = 'unverified',
  inferred = 'inferred',
  confirmed = 'confirmed',
  contested = 'contested'
}

export enum SamSourceType {
  user = 'user',
  system = 'system',
  import = 'import',
  derived = 'derived',
  doc = 'doc'
}

export enum SamDecayType {
  exponential = 'exponential',
  none = 'none'
}

export class SamContextWindowDto {
  @ApiProperty({ type: [String], description: 'Contexts where memory applies' })
  @IsArray()
  @IsString({ each: true })
  applies_to: string[];

  @ApiProperty({ type: [String], description: 'Contexts to exclude' })
  @IsArray()
  @IsString({ each: true })
  excludes: string[];
}

export class SamDecayPolicyDto {
  @ApiProperty({ enum: SamDecayType })
  @IsEnum(SamDecayType)
  type: SamDecayType;

  @ApiProperty({ description: 'Days for confidence to halve' })
  @IsNumber()
  @Min(7)
  @Max(3650)
  half_life_days: number;

  @ApiProperty({ description: 'Minimum confidence before archival' })
  @IsNumber()
  @Min(0)
  @Max(1)
  min_confidence: number;
}

export class SamTrainingExampleDto {
  @ApiProperty({ description: 'User prompt' })
  @IsString()
  @MinLength(3)
  @MaxLength(600)
  user: string;

  @ApiProperty({ description: 'Expected assistant response' })
  @IsString()
  @MinLength(3)
  @MaxLength(1200)
  assistant: string;

  @ApiProperty({ type: [String], description: 'Assertions to validate' })
  @IsArray()
  @IsString({ each: true })
  assertions: string[];
}

export class CreateSamMemoryDto {
  @ApiPropertyOptional({ description: 'Memory title (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @ApiProperty({ description: 'Memory content' })
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  content: string;

  @ApiProperty({ type: [String], description: 'Tags' })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ enum: SamReliability })
  @IsEnum(SamReliability)
  reliability: SamReliability;

  @ApiProperty({ description: 'Confidence score 0-1' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence_score: number;

  @ApiProperty({ type: SamContextWindowDto })
  @ValidateNested()
  @Type(() => SamContextWindowDto)
  context_window: SamContextWindowDto;

  @ApiProperty({ type: SamDecayPolicyDto })
  @ValidateNested()
  @Type(() => SamDecayPolicyDto)
  decay_policy: SamDecayPolicyDto;

  @ApiPropertyOptional({ type: [SamTrainingExampleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SamTrainingExampleDto)
  training_examples?: SamTrainingExampleDto[];
}
