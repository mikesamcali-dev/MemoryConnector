import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsBoolean, IsArray, IsOptional, IsInt, Min, Max } from 'class-validator';
import { TriggerType, Frequency } from '@prisma/client';

export class UpdateIntentionDto {
  @ApiPropertyOptional({ enum: TriggerType })
  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  triggerValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ifThenPhrase?: string;

  @ApiPropertyOptional({ enum: Frequency })
  @IsOptional()
  @IsEnum(Frequency)
  frequency?: Frequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  customDays?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
