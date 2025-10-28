import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
    ) {}

    async register(dto: CreateUserDto) {
        const user = await this.usersService.create(dto);

        const token = await this.generateToken(user._id, user.role);

        return { user, token };
    }

    async login(emailOrUsername: string, password: string) {
        const user = await this.usersService.findByEmailOrUsername(emailOrUsername);
        if(!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) throw new UnauthorizedException('Invalid credentials');

        const token = await this.generateToken(user.id, user.role);

        const { password: _, ...userData } = user.toObject();

        return { user: userData, token };
    }

    private async generateToken(userId: string, role: string) {
        const payload = { userId, role };
        return this.jwtService.signAsync(payload);
    }

    async authorize(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new UnauthorizedException('User not found');
        return user;
    }
}
