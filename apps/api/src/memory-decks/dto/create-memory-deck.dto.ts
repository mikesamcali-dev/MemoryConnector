import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMemoryDeckDto {
  @ApiProperty({
    description: 'Optional custom title for the memory deck',
    example: 'Week of Jan 17, 2026',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
