import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReviewRating {
  AGAIN = 'again',  // Complete blackout, incorrect response
  HARD = 'hard',    // Incorrect response, but correct one remembered
  GOOD = 'good',    // Correct response, with hesitation
  EASY = 'easy',    // Perfect response
}

export class SubmitReviewDto {
  @ApiProperty({ description: 'Memory ID being reviewed' })
  @IsUUID()
  memoryId: string;

  @ApiProperty({
    description: 'Review rating',
    enum: ReviewRating,
    example: ReviewRating.GOOD
  })
  @IsEnum(ReviewRating)
  rating: ReviewRating;
}
