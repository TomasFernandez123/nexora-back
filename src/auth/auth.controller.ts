import { Body, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { buildResponse } from '../common/utils/build-response';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/multer.config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @UseInterceptors(FileInterceptor('photo', multerConfig))
    async register(@Body() dto: CreateUserDto, @Req() req, @UploadedFile() file: Express.Multer.File) {
        const imageUrl = file.path;
        const result = await this.authService.register({...dto, photo: imageUrl});
        return buildResponse(true, 'Registration successful', result, req);
    }

    @Post('login')
    async login(@Body() dto: LoginDto, @Req() req) {
        const emailOrUsername = dto.email || dto.username!;
        const result = await this.authService.login(emailOrUsername, dto.password);
        return buildResponse(true, 'Login successful', result, req);
    }

    @Post('authorize')
    @UseGuards(JwtAuthGuard)
    async authorize(@Req() req) {
        return this.authService.authorize(req.user.id);
    }

}
