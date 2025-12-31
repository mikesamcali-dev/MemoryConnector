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
} from 'class-validator';
import {
  TranscriptStatusDto,
  TranscriptSourceDto,
  IngestionStatusDto,
} from './create-youtube-video.dto';

export class UpdateYouTubeVideoDto {
  @ApiProperty({
    description: 'Video title',
    required: false,
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  title?: string;

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
    required: false,
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  creatorDisplayName?: string;

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
    description: 'Video duration in seconds',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiProperty({
    description: 'Language code (BCP-47)',
    required: false,
    maxLength: 12,
  })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  languageCode?: string;

  @ApiProperty({
    description: 'Transcript status',
    enum: TranscriptStatusDto,
    required: false,
  })
  @IsOptional()
  @IsEnum(TranscriptStatusDto)
  transcriptStatus?: TranscriptStatusDto;

  @ApiProperty({
    description: 'Transcript source',
    enum: TranscriptSourceDto,
    required: false,
  })
  @IsOptional()
  @IsEnum(TranscriptSourceDto)
  transcriptSource?: TranscriptSourceDto;

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
    required: false,
  })
  @IsOptional()
  @IsEnum(IngestionStatusDto)
  ingestionStatus?: IngestionStatusDto;

  @ApiProperty({
    description: 'Last ingestion error message',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastIngestionError?: string;
}
