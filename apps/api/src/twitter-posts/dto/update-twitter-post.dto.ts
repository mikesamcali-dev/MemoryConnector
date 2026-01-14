import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumber } from 'class-validator';

export class UpdateTwitterPostDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  creatorDisplayName?: string;

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
}
