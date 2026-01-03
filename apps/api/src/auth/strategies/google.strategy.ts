import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || 'dummy';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || 'dummy';

    // Warn if credentials are not configured
    if (clientID === 'dummy' || clientID === 'your-google-client-id-here' ||
        clientSecret === 'dummy' || clientSecret === 'your-google-client-secret-here') {
      console.warn('⚠️  Google OAuth not configured - Sign in with Google will not work. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    }

    super({
      clientID,
      clientSecret,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:4000/api/v1/auth/google/callback'),
      scope: ['email', 'profile'],
      accessType: 'offline',
      prompt: 'select_account',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      name: displayName,
      accessToken,
    };
    done(null, user);
  }
}
