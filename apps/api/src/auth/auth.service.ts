import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { SessionsService } from './sessions/sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private sessionsService: SessionsService,
    private prisma: PrismaService,
    private config: ConfigService,
    private emailService: EmailService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);

    // Create refresh token
    const refreshToken = await this.sessionsService.createSession(user.id);

    // Check if user has completed onboarding
    const profile = await this.prisma.userMemoryProfile.findUnique({
      where: { userId: user.id },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        tier: user.tier,
        roles: user.roles,
        requirePasswordChange: user.requirePasswordChange || false,
        onboardingCompleted: !!profile,
      },
    };
  }

  async signup(email: string, password: string, isAdminCreated: boolean = false) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        tier: 'free',
        roles: ['user'],
        requirePasswordChange: isAdminCreated,
      },
    });

    // Create user usage record
    await this.prisma.userUsage.create({
      data: {
        userId: user.id,
      },
    });

    // If admin-created, send welcome email and return user without auto-login
    if (isAdminCreated) {
      await this.emailService.sendWelcomeEmail(email, password);
      return {
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          roles: user.roles,
        },
      };
    }

    // Self-signup: Auto-login
    return this.login(user);
  }

  async refreshToken(refreshToken: string) {
    const session = await this.sessionsService.validateAndRefresh(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { email: user.email, sub: user.id, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async logout(refreshToken: string) {
    await this.sessionsService.revokeSession(refreshToken);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // Get user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found or no password set');
    }

    // Verify old password
    const isValid = await argon2.verify(user.passwordHash, oldPassword);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await argon2.hash(newPassword);

    // Update password and clear requirePasswordChange flag
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        requirePasswordChange: false,
      },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  async googleLogin(googleUser: { googleId: string; email: string; name: string }) {
    // Check if user exists by Google ID
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      // Check if user exists by email (might have signed up with password)
      user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // Link Google account to existing email account
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            provider: 'google',
          },
        });
      } else {
        // Create new user with Google OAuth
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.googleId,
            provider: 'google',
            tier: 'free',
            roles: ['user'],
          },
        });

        // Create user usage record
        await this.prisma.userUsage.create({
          data: {
            userId: user.id,
          },
        });
      }
    }

    // Log the user in
    return this.login(user);
  }
}

