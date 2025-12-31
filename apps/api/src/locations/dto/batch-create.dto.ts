import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationBatchItem {
  @ApiProperty({ description: 'Location name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Latitude coordinate', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Street address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'State or province', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'ZIP or postal code', required: false })
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiProperty({ description: 'Country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Place type', required: false })
  @IsOptional()
  @IsString()
  placeType?: string;
}

export class BatchCreateLocationsDto {
  @ApiProperty({
    description: 'Array of locations to create',
    type: [LocationBatchItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationBatchItem)
  locations: LocationBatchItem[];
}
