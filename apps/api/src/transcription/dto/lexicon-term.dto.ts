import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LexiconTermDto {
  @ApiProperty({
    description: 'The term to recognize (e.g., "Makino", "Prophet 21")',
  })
  @IsNotEmpty()
  @IsString()
  term: string;

  @ApiProperty({
    description: 'Optional replacement text (if different from term)',
    required: false,
  })
  @IsOptional()
  @IsString()
  replacement?: string;

  @ApiProperty({
    description: 'Bias weight for STT provider (1.0 = normal, higher = stronger bias)',
    required: false,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10.0)
  weight?: number;
}
