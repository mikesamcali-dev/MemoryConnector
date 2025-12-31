import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class SearchLocationDto {
  @ApiProperty({ description: 'Search query for location' })
  @IsString()
  input_query: string;

  @ApiProperty({ required: false, description: 'User country code', default: 'US' })
  @IsOptional()
  @IsString()
  user_country?: string;

  @ApiProperty({ required: false, description: 'User region/state', example: 'MI' })
  @IsOptional()
  @IsString()
  user_region_state?: string;

  @ApiProperty({ required: false, description: 'Location bias latitude' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  bias_latitude?: number;

  @ApiProperty({ required: false, description: 'Location bias longitude' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  bias_longitude?: number;

  @ApiProperty({ required: false, description: 'Location bias radius in meters' })
  @IsOptional()
  @IsNumber()
  bias_radius_meters?: number;

  @ApiProperty({ required: false, description: 'Maximum number of candidates', default: 5 })
  @IsOptional()
  @IsNumber()
  max_candidates?: number;
}

export interface LocationSearchResult {
  place_id: string | null;
  name: string | null;
  canonical_address: {
    street: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  };
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  categories: string[];
  opening_hours: {
    weekday_text: string[];
    open_now: boolean | null;
  };
  confidence_score: number;
  matched_fields: string[];
  source_api: {
    name: string;
    version: string;
  };
  raw_api_response_snippet: string | null;
  suggestions: string[];
}

export interface LocationSearchResponse {
  input_query: string;
  normalized_query: string;
  results: LocationSearchResult[];
  metadata: {
    request_timestamp: string;
    runtime_ms: number;
    api_calls_made: Array<{
      method: string;
      url: string;
      status: number | null;
    }>;
  };
  error: {
    message: string;
    type: string;
    http_status: number | null;
  } | null;
}
