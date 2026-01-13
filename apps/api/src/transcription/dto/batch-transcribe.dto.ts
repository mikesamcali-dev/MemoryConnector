import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchTranscribeDto {
  @ApiProperty({
    description: 'Optional metadata for the transcription request',
    required: false,
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}
