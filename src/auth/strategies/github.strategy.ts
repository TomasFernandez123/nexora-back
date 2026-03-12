import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any) => void,
  ): Promise<void> {
    const emails = profile.emails ?? [];
    const email = emails[0]?.value;

    if (!email) {
      throw new UnauthorizedException('GitHub account has no public email available');
    }

    const user = {
      email,
      firstName: profile.displayName?.split(' ')[0] ?? profile.username,
      lastName: profile.displayName?.split(' ').slice(1).join(' ') ?? '',
      picture: profile.photos?.[0]?.value,
      provider: 'github',
      providerId: profile.id,
    };
    done(null, user);
  }
}
