import { ApiProperty } from '@nestjs/swagger';

export class MemoryDeckResponseDto {
  @ApiProperty({ description: 'Memory deck ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Optional custom title', required: false })
  title?: string;

  @ApiProperty({ description: 'Whether the deck is archived' })
  isArchived: boolean;

  @ApiProperty({ description: 'Whether the deck was auto-created by the system' })
  autoCreated: boolean;

  @ApiProperty({ description: 'Week start date for auto-created decks', required: false })
  weekStartDate?: Date;

  @ApiProperty({ description: 'Number of items in the deck' })
  itemCount: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class MemoryDeckItemResponseDto {
  @ApiProperty({ description: 'Memory deck item ID' })
  id: string;

  @ApiProperty({ description: 'Memory deck ID' })
  memoryDeckId: string;

  @ApiProperty({ description: 'Memory ID' })
  memoryId: string;

  @ApiProperty({ description: 'Sort order within deck' })
  sortOrder: number;

  @ApiProperty({ description: 'Memory data with all relations' })
  memory: any;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
