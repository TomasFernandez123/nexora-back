import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET || 'default_jwt_secret',
            signOptions: { expiresIn: '7m' },
        })
    ],
    providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy],
    controllers: [AuthController],
})
export class AuthModule {}
