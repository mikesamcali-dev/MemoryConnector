import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
  IsUrl,
  MaxLength,
  IsJSON,
} from 'class-validator';

export enum TranscriptStatusDto {
  NONE = 'none',
  PARTIAL = 'partial',
  FULL = 'full',
  FAILED = 'failed',
}

export enum TranscriptSourceDto {
  CAPTIONS = 'captions',
  AUTO = 'auto',
  ASR = 'asr',
  MANUAL = 'manual',
  UNKNOWN = 'unknown',
}

export enum IngestionStatusDto {
  QUEUED = 'queued',
  INGESTED = 'ingested',
  RETRY = 'retry',
  FAILED = 'failed',
  BLOCKED = 'blocked',
}

export class CreateYouTubeVideoDto {
  @ApiProperty({
    description: 'YouTube video ID (from URL)',
    example: 'dQw4w9WgXcQ',
    maxLength: 16,
  })
  @IsString()
  @MaxLength(16)
  youtubeVideoId: string;

  @ApiProperty({
    description: 'Canonical YouTube URL',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    maxLength: 2048,
  })
  @IsUrl()
  @MaxLength(2048)
  canonicalUrl: string;

  @ApiProperty({
    description: 'Video title',
    example: 'Example Video Title',
    maxLength: 512,
  })
  @IsString()
  @MaxLength(512)
  title: string;

  @ApiProperty({
    description: 'Video description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Thumbnail URL',
    required: false,
    maxLength: 2048,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Creator/channel display name',
    example: 'Example Creator',
    maxLength: 256,
  })
  @IsString()
  @MaxLength(256)
  creatorDisplayName: string;

  @ApiProperty({
    description: 'YouTube channel ID',
    required: false,
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  channelId?: string;

  @ApiProperty({
    description: 'Video publish date (ISO 8601)',
    example: '2025-12-01T12:00:00Z',
  })
  @IsDateString()
  publishedAt: string;

  @ApiProperty({
    description: 'Video duration in seconds',
    example: 623,
  })
  @IsInt()
  @Min(0)
  durationSeconds: number;

  @ApiProperty({
    description: 'Language code (BCP-47)',
    example: 'en',
    maxLength: 12,
  })
  @IsString()
  @MaxLength(12)
  languageCode: string;

  @ApiProperty({
    description: 'Transcript status',
    enum: TranscriptStatusDto,
  })
  @IsEnum(TranscriptStatusDto)
  transcriptStatus: TranscriptStatusDto;

  @ApiProperty({
    description: 'Transcript source',
    enum: TranscriptSourceDto,
  })
  @IsEnum(TranscriptSourceDto)
  transcriptSource: TranscriptSourceDto;

  @ApiProperty({
    description: 'Full transcript text',
    required: false,
  })
  @IsOptional()
  @IsString()
  transcriptText?: string;

  @ApiProperty({
    description: 'Transcript segments (JSON array)',
    required: false,
  })
  @IsOptional()
  transcriptSegments?: any;

  @ApiProperty({
    description: 'Video summary',
    required: false,
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({
    description: 'Topics (JSON array)',
    required: false,
  })
  @IsOptional()
  topics?: any;

  @ApiProperty({
    description: 'Chapters (JSON array)',
    required: false,
  })
  @IsOptional()
  chapters?: any;

  @ApiProperty({
    description: 'View count snapshot',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  viewCount?: number;

  @ApiProperty({
    description: 'Like count snapshot',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  likeCount?: number;

  @ApiProperty({
    description: 'YouTube category ID',
    required: false,
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  categoryId?: string;

  @ApiProperty({
    description: 'Tags (JSON array)',
    required: false,
  })
  @IsOptional()
  tags?: any;

  @ApiProperty({
    description: 'External links (JSON array)',
    required: false,
  })
  @IsOptional()
  externalLinks?: any;

  @ApiProperty({
    description: 'Content hash for deduplication',
    required: false,
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  contentHash?: string;

  @ApiProperty({
    description: 'Ingestion status',
    enum: IngestionStatusDto,
    default: IngestionStatusDto.QUEUED,
  })
  @IsOptional()
  @IsEnum(IngestionStatusDto)
  ingestionStatus?: IngestionStatusDto;
}
