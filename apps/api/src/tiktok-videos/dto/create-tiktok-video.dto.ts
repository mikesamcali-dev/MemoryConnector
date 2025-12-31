import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsDateString, IsUrl } from 'class-validator';

export class CreateTikTokVideoDto {
  @ApiProperty({ description: 'TikTok video ID' })
  @IsString()
  tiktokVideoId: string;

  @ApiProperty({ description: 'Canonical URL of the TikTok video' })
  @IsUrl()
  canonicalUrl: string;

  @ApiProperty({ description: 'Video title/caption' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, description: 'Video description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Thumbnail URL' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Creator display name' })
  @IsString()
  creatorDisplayName: string;

  @ApiProperty({ required: false, description: 'Creator username' })
  @IsOptional()
  @IsString()
  creatorUsername?: string;

  @ApiProperty({ required: false, description: 'Creator ID' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiProperty({ required: false, description: 'Published date' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiProperty({ required: false, description: 'Duration in seconds' })
  @IsOptional()
  @IsInt()
  durationSeconds?: number;

  @ApiProperty({ required: false, description: 'Video transcript from Whisper' })
  @IsOptional()
  @IsString()
  transcript?: string;
}
