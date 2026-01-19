import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: false, required: false, description: 'Whether this is an admin-created user' })
  @IsOptional()
  @IsBoolean()
  isAdminCreated?: boolean;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!', description: 'Current password' })
  @IsString()
  @MinLength(8)
  oldPassword: string;

  @ApiProperty({ example: 'NewSecurePassword123!', description: 'New password', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}

