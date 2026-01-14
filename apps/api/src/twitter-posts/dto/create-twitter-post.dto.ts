import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumber } from 'class-validator';

export class CreateTwitterPostDto {
  @ApiProperty()
  @IsString()
  twitterPostId: string;

  @ApiProperty()
  @IsString()
  canonicalUrl: string;

  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty()
  @IsString()
  creatorDisplayName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  creatorUsername?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  languageCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  viewCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  likeCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  replyCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  retweetCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quoteCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bookmarkCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasMedia?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  mediaUrls?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  mediaTypes?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  hashtags?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  mentions?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  externalLinks?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isReply?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isRetweet?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isQuote?: boolean;

  @ApiProperty()
  @IsString()
  userId: string;
}
