import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateTrainingDeckDto {
  @ApiProperty({
    description: 'Training ID to create deck from',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  trainingId: string;

  @ApiProperty({
    description: 'Optional custom title for the deck',
    example: 'ML Fundamentals - Week 1',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;
}
