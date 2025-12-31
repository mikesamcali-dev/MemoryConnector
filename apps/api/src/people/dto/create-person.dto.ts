import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreatePersonDto {
  @ApiProperty({ description: 'Person display name' })
  @IsString()
  displayName: string;

  @ApiProperty({ required: false, description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, description: 'Biography' })
  @IsOptional()
  @IsString()
  bio?: string;
}
