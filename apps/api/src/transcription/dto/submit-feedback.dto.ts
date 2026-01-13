import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitFeedbackDto {
  @ApiProperty({
    description: 'Session ID associated with the transcript',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({
    description: 'Raw transcript from speech-to-text',
  })
  @IsNotEmpty()
  @IsString()
  rawTranscript: string;

  @ApiProperty({
    description: 'User-corrected text',
  })
  @IsNotEmpty()
  @IsString()
  correctedText: string;

  @ApiProperty({
    description: 'Whether user consented to store corrections for learning',
    default: false,
  })
  @IsBoolean()
  consentStore: boolean;
}
