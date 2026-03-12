import { Body, Controller, Get, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { buildResponse } from '../common/utils/build-response';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerUserConfig } from '../config/multer.config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    private getJwtCookieOptions(): CookieOptions {
        const isProd = this.configService.get<string>('NODE_ENV') === 'production';

        return {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
            maxAge: 1 * 60 * 7 * 1000, // 7 minutes
        };
    }

    @Post('register')
    @UseInterceptors(FileInterceptor('photo', multerUserConfig))
    async register(@Body() dto: CreateUserDto, @UploadedFile() file: Express.Multer.File) {
        const imageUrl = file.path;
        const result = await this.authService.register({...dto, photo: imageUrl});
        return buildResponse('Registration successful', result);
    }

    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const emailOrUsername = dto.email || dto.username!;
        const result = await this.authService.login(emailOrUsername, dto.password);

        if (result) {
            res.cookie('jwt', result.token, this.getJwtCookieOptions());
        }

        const { token, ...resultWithoutToken } = result;

        return buildResponse('Login successful', resultWithoutToken);
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('jwt', this.getJwtCookieOptions());
        return { success: true ,message: 'Logout successful' };
    }


    @Post('authorize')
    @UseGuards(JwtAuthGuard)
    async authorize(@Req() req) {
        return this.authService.authorize(req.user.id);
    }

    @Post('refresh-token')
    @UseGuards(JwtAuthGuard)
    async refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.refreshToken(req.user.id, req.user.role);

        res.cookie('jwt', result.token, this.getJwtCookieOptions());

        return buildResponse('Token refreshed successfully', result);
    }

    @Post('set-password')
    @UseGuards(JwtAuthGuard)
    async setPassword(@Req() req, @Body() dto: SetPasswordDto) {
        const result = await this.authService.setPassword(req.user.id, dto.password);
        return buildResponse('Password configured successfully', result);
    }

    // ---- OAuth: Google ----

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {}

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthCallback(@Req() req, @Res() res: Response) {
        return this.handleOAuthCallback(req, res);
    }

    // ---- OAuth: GitHub ----

    @Get('github')
    @UseGuards(GithubAuthGuard)
    async githubAuth() {}

    @Get('github/callback')
    @UseGuards(GithubAuthGuard)
    async githubAuthCallback(@Req() req, @Res() res: Response) {
        return this.handleOAuthCallback(req, res);
    }

    // ---- Shared OAuth callback handler ----

    private async handleOAuthCallback(req: any, res: Response) {
        const result = await this.authService.socialLogin(req.user);

        res.cookie('jwt', result.token, this.getJwtCookieOptions());

        const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
        return res.redirect(`${frontendUrl}/auth/callback`);
    }

}
