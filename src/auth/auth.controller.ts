import { Body, Controller, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { buildResponse } from '../common/utils/build-response';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerUserConfig } from '../config/multer.config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

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
            res.cookie('jwt', result.token, 
                { 
                    httpOnly: true, 
                    secure: true, 
                    sameSite: 'none',
                    path: '/',
                    maxAge: 1 * 60 * 7 * 1000, // 7 minutes
                });
        }

        const { token, ...resultWithoutToken } = result;

        return buildResponse('Login successful', resultWithoutToken);
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('jwt', { 
                    httpOnly: true, 
                    secure: true, 
                    sameSite: 'none',
                    path: '/',
                    maxAge: 1 * 60 * 7 * 1000, // 7 minutes
                }); 
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

        res.cookie('jwt', result.token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 1 * 60 * 7 * 1000
        });

        return buildResponse('Token refreshed successfully', result);
    }

}
