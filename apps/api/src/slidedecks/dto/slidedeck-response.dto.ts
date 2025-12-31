import { ApiProperty } from '@nestjs/swagger';

export class SlideDeckResponseDto {
  @ApiProperty({ description: 'Slide deck ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Optional custom title', required: false })
  title?: string;

  @ApiProperty({ description: 'Number of slides in the deck' })
  slideCount: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class SlideResponseDto {
  @ApiProperty({ description: 'Slide ID' })
  id: string;

  @ApiProperty({ description: 'Slide deck ID' })
  slideDeckId: string;

  @ApiProperty({ description: 'Reminder ID' })
  reminderId: string;

  @ApiProperty({ description: 'Memory ID' })
  memoryId: string;

  @ApiProperty({ description: 'Sort order within deck' })
  sortOrder: number;

  @ApiProperty({ description: 'Memory data with all relations' })
  memory: any;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
