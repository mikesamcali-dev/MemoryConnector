import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class ExtractMetadataDto {
  @ApiProperty({ description: 'Twitter/X post URL' })
  @IsString()
  @IsUrl()
  url: string;
}

export interface TwitterMetadata {
  twitterPostId: string;
  canonicalUrl: string;
  text: string;
  thumbnailUrl?: string;
  creatorDisplayName: string;
  creatorUsername?: string;
  creatorId?: string;
  publishedAt?: string;
  languageCode?: string;
}
