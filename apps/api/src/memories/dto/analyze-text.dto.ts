import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeTextDto {
  @ApiProperty({
    description: 'Text content to analyze for entities',
    example: 'I met Sarah Johnson at Starbucks yesterday.',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
