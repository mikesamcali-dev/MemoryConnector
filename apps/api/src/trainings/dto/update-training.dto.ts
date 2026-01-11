import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsArray } from 'class-validator';

export class UpdateTrainingDto {
  @ApiProperty({
    description: 'Training name',
    example: 'Machine Learning Fundamentals',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Training description',
    example: 'A comprehensive training on ML concepts and algorithms',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tags for the training',
    example: ['ml', 'ai', 'python'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
