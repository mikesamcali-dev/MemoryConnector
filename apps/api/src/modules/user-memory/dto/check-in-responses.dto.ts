import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { CheckInType } from '@prisma/client';

export class CheckInResponsesDto {
  @ApiProperty({
    enum: CheckInType,
    description: 'Type of check-in',
    example: CheckInType.WEEKLY,
  })
  @IsEnum(CheckInType)
  checkInType: CheckInType;

  @ApiProperty({
    description: 'Responses to dynamic questions',
    example: { satisfaction: 4, difficulty: 3, wantsChange: false },
  })
  @IsObject()
  responses: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Reason for triggered check-in',
    example: 'low_engagement',
  })
  @IsOptional()
  triggerReason?: string;
}
