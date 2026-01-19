import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { SignupDto, LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User created and logged in' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async signup(@Body() signupDto: SignupDto, @Res() res: Response) {
    const result = await this.authService.signup(
      signupDto.email,
      signupDto.password,
      signupDto.isAdminCreated || false
    );

    // If admin-created, return user without setting refresh token
    if (signupDto.isAdminCreated) {
      return res.status(HttpStatus.CREATED).json({
        user: result.user,
      });
    }

    // Type guard: if not admin-created, result has refreshToken and accessToken
    if ('refreshToken' in result && 'accessToken' in result) {
      // Set refresh token in httpOnly cookie for self-signup
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/api/v1/auth/refresh',
      });

      return res.status(HttpStatus.CREATED).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    }
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() req: any, @Res() res: Response) {
    const result = await this.authService.login(req.user);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/v1/auth/refresh',
    });

    return res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', {
      path: '/api/v1/auth/refresh',
    });

    return res.json({ message: 'Logged out successfully' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User information' })
  async getMe(@Req() req: any) {
    return req.user;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect or unauthorized' })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: any) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword
    );
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    // Handle Google OAuth callback
    const result = await this.authService.googleLogin({
      googleId: req.user.googleId,
      email: req.user.email,
      name: req.user.name,
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/v1/auth/refresh',
    });

    // Redirect to frontend with access token
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    return res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }
}

