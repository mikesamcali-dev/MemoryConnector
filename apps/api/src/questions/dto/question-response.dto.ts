import { ApiProperty } from '@nestjs/swagger';

export class QuestionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  memoryId: string;

  @ApiProperty()
  question: string;

  @ApiProperty({ nullable: true })
  answer: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
