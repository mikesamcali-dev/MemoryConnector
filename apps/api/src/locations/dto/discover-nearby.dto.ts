import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class DiscoverNearbyDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 37.7749,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -122.4194,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Search radius in meters',
    example: 1000,
    required: false,
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  radiusMeters?: number;
}
