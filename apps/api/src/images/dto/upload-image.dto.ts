import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({ description: 'Base64-encoded image data' })
  @IsNotEmpty()
  @IsString()
  imageData: string;

  @ApiProperty({ description: 'Image content type (e.g., image/jpeg, image/png)' })
  @IsNotEmpty()
  @IsString()
  contentType: string;

  @ApiPropertyOptional({ description: 'Original filename' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ description: 'Consent to store biometric data' })
  @IsOptional()
  @IsBoolean()
  consentBiometrics?: boolean;

  @ApiPropertyOptional({ description: 'Image capture timestamp (ISO-8601)' })
  @IsOptional()
  @IsDateString()
  capturedAt?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Location accuracy in meters' })
  @IsOptional()
  @IsNumber()
  locationAccuracy?: number;

  @ApiPropertyOptional({ description: 'Location source (e.g., gps, user, exif)' })
  @IsOptional()
  @IsString()
  locationSource?: string;
}
