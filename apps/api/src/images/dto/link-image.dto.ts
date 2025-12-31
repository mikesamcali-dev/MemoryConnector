import { IsNotEmpty, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkImageDto {
  @ApiProperty({ description: 'Memory ID to link the image to' })
  @IsNotEmpty()
  @IsString()
  memoryId: string;

  @ApiProperty({ description: 'Image ID to link' })
  @IsNotEmpty()
  @IsString()
  imageId: string;
}

export class LinkImagesToMemoryDto {
  @ApiProperty({ description: 'Array of image IDs to link to this memory' })
  @IsArray()
  @IsString({ each: true })
  imageIds: string[];
}
