import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Memory ID associated with this question',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  memoryId: string;

  @ApiProperty({
    description: 'The question text',
    example: 'What is the capital of France?',
  })
  @IsString()
  question: string;
}
