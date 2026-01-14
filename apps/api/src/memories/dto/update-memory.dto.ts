import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';

export class UpdateMemoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false, description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ required: false, description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({ required: false, description: 'Memory type ID' })
  @IsOptional()
  @IsUUID()
  typeId?: string;

  @ApiProperty({ required: false, description: 'Word ID to link to this memory' })
  @IsOptional()
  @IsUUID()
  wordId?: string | null;

  @ApiProperty({ required: false, description: 'Event ID to link to this memory' })
  @IsOptional()
  @IsUUID()
  eventId?: string | null;

  @ApiProperty({ required: false, description: 'Location ID to link to this memory' })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @ApiProperty({ required: false, description: 'Person ID to link to this memory' })
  @IsOptional()
  @IsUUID()
  personId?: string | null;

  @ApiProperty({ required: false, description: 'YouTube Video ID to link to this memory' })
  @IsOptional()
  @IsUUID()
  youtubeVideoId?: string | null;

  @ApiProperty({ required: false, description: 'TikTok Video ID to link to this memory' })
  @IsOptional()
  @IsUUID()
  tiktokVideoId?: string | null;

  @ApiProperty({ required: false, description: 'Twitter Post ID to link to this memory' })
  @IsOptional()
  @IsUUID()
  twitterPostId?: string | null;
}
