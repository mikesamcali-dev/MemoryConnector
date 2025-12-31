import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class ExtractMetadataDto {
  @ApiProperty({
    description: 'TikTok video URL to extract metadata from',
    example: 'https://www.tiktok.com/@username/video/1234567890',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export interface TikTokMetadata {
  tiktokVideoId: string;
  canonicalUrl: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  creatorDisplayName: string;
  creatorUsername?: string;
  creatorId?: string;
  publishedAt?: string;
  durationSeconds?: number;
  viewCount?: number;
  likeCount?: number;
  shareCount?: number;
  commentCount?: number;
  transcript?: string;
}
