import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsArray, IsInt, Min, Max } from 'class-validator';

export class IngestYouTubeUrlDto {
  @ApiProperty({
    description: 'YouTube URL to ingest',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsUrl()
  youtubeUrl: string;

  @ApiProperty({
    description: 'Preferred transcript language codes',
    required: false,
    example: ['en', 'en-US'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  transcriptLanguagePreference?: string[];

  @ApiProperty({
    description: 'Maximum transcript characters',
    required: false,
    default: 250000,
  })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(1000000)
  maxTranscriptChars?: number;

  @ApiProperty({
    description: 'Enable chunking for transcript segments',
    required: false,
    default: true,
  })
  @IsOptional()
  enableChunking?: boolean;

  @ApiProperty({
    description: 'Maximum tokens per chunk',
    required: false,
    default: 900,
  })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(2000)
  maxChunkTokens?: number;

  @ApiProperty({
    description: 'Overlap tokens between chunks',
    required: false,
    default: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  overlapTokens?: number;
}
