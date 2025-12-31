import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdatePersonDto {
  @ApiProperty({ required: false, description: 'Person display name' })
  @IsOptional()
  @IsString()
  displayName?: string;

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
