import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, IsEnum } from 'class-validator';
import { StorageStrategy } from '@prisma/client';

export class CreateMemoryTypeDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: '📝' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false, default: '#6B7280' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false, enum: StorageStrategy, default: StorageStrategy.generic })
  @IsOptional()
  @IsEnum(StorageStrategy)
  storageStrategy?: StorageStrategy;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
