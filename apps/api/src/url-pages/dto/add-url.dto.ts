import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddUrlDto {
  @ApiProperty({
    description: 'The URL to fetch and analyze',
    example: 'https://example.com/article',
  })
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @IsNotEmpty()
  url: string;
}
