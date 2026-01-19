import { IsString, IsArray, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
  @ValidateNested({ each: true })
  @Type(() => ConversationTurnDto)
  conversation: ConversationTurnDto[];

  @ApiProperty({ description: 'Active task or context' })
  @IsString()
  active_task: string;

  @ApiPropertyOptional({ description: 'UI state context' })
  @IsOptional()
  @IsObject()
  ui_state?: Record<string, any>;
}
