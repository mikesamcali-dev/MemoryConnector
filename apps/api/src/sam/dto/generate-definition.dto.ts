import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateDefinitionDto {
  @ApiProperty({ description: 'Term or phrase to define' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  term: string;
}

export class DefinitionResponse {
  @ApiProperty({ description: 'Comprehensive definition with etymology, examples, synonyms, antonyms' })
  definition: string;

  @ApiProperty({ description: 'Extracted domain keywords and concept categories (6-8 terms)', type: [String] })
  keywords: string[];
}
