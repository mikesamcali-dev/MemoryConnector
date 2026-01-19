import { IsString, IsArray, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversationTurnDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsString()
  speaker: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class RecallSamMemoryDto {
  @ApiProperty({ type: [ConversationTurnDto], description: 'Recent conversation turns' })
  @IsArray()
  conversation: ConversationTurnDto[];

  @ApiProperty({ description: 'Active task or context' })
  @IsString()
  active_task: string;

  @ApiPropertyOptional({ description: 'UI state context' })
  @IsOptional()
  @IsObject()
  ui_state?: Record<string, any>;
}
