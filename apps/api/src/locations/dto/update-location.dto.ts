import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ required: false, description: 'Location name' })
  @IsOptional()
  @IsString()
  name?: string;

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

  @ApiProperty({ required: false, description: 'Street address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, description: 'City name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'State/province name' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false, description: 'Zip or postal code' })
  @IsOptional()
  @IsString()
  zip?: string;

  @ApiProperty({ required: false, description: 'Country name' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, description: 'Location type category (e.g., home, work, restaurant, park)' })
  @IsOptional()
  @IsString()
  locationType?: string;

  @ApiProperty({ required: false, description: 'Specific place type (e.g., coffee shop, museum, landmark)' })
  @IsOptional()
  @IsString()
  placeType?: string;
}
