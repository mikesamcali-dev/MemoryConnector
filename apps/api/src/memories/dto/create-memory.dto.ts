import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';

export class CreateMemoryDto {
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

  @ApiProperty({ required: false, description: 'Location ID to link this memory to' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ required: false, description: 'Person ID to link this memory to' })
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiProperty({ required: false, description: 'YouTube Video ID to link this memory to' })
  @IsOptional()
  @IsUUID()
  youtubeVideoId?: string;

  @ApiProperty({ required: false, description: 'TikTok Video ID to link this memory to' })
  @IsOptional()
  @IsUUID()
  tiktokVideoId?: string;

  @ApiProperty({ required: false, description: 'Whether to create reminders for this memory' })
  @IsOptional()
  createReminder?: boolean;
}

