import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateTrainingDeckDto {
  @ApiProperty({
    description: 'Deck title',
    example: 'ML Fundamentals - Updated',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;
}
