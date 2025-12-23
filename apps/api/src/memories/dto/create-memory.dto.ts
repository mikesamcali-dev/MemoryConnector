import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { MemoryType } from '@prisma/client';

export class CreateMemoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ enum: MemoryType, required: false })
  @IsOptional()
  @IsEnum(MemoryType)
  type?: MemoryType;
}

