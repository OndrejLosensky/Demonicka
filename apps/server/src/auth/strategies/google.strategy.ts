import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { LoggingService } from '../../logging/logging.service';

export interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private loggingService: LoggingService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL must be defined',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    this.logger.debug(`Google OAuth validation for profile: ${profile.id}`);

    const { id, displayName, name, emails, photos } = profile;
    const email = emails?.[0]?.value?.toLowerCase();

    if (!email) {
      this.loggingService.auditFailure('GOOGLE_LOGIN_FAILED', 'Google login failed – no email in profile', {
        googleId: id,
        displayName: profile.displayName,
      });
      return done(new Error('No email found in Google profile'), undefined);
    }

    // Find or create user
    let user = await this.usersService.findOrCreateGoogleUser({
      googleId: id,
      email,
      displayName,
      firstName: name?.givenName,
      lastName: name?.familyName,
      photoUrl: photos?.[0]?.value,
    });

    this.logger.debug(`Google OAuth validation successful for user: ${user.id}`);
    return done(null, user);
  }
}
