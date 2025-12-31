import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSlideDeckDto {
  @ApiProperty({
    description: 'Optional custom title for the slide deck',
    example: 'Review Deck - Jan 2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
